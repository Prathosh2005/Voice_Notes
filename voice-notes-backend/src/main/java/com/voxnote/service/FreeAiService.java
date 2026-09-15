package com.voxnote.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FreeAiService {

    @Value("${assemblyai.api.key}")
    private String assemblyAiKey;

    @Value("${gemini.api.key}")
    private String geminiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public FreeAiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String transcribeAudio(String audioFilePath) throws Exception {
        if (assemblyAiKey == null || assemblyAiKey.isEmpty() || assemblyAiKey.contains("YOUR_ASSEMBLYAI_KEY")) {
            throw new IllegalArgumentException("AssemblyAI API key is missing or invalid.");
        }

        // 1. Upload audio file
        Path path = Path.of(audioFilePath);
        byte[] fileBytes = Files.readAllBytes(path);

        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.set("Authorization", assemblyAiKey);
        uploadHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        HttpEntity<byte[]> uploadEntity = new HttpEntity<>(fileBytes, uploadHeaders);

        ResponseEntity<String> uploadResponse = restTemplate.exchange(
                "https://api.assemblyai.com/v2/upload",
                HttpMethod.POST,
                uploadEntity,
                String.class
        );

        JsonNode uploadJson = objectMapper.readTree(uploadResponse.getBody());
        String uploadUrl = uploadJson.get("upload_url").asText();

        // 2. Transcribe
        Map<String, String> transcriptBody = Map.of("audio_url", uploadUrl);
        
        HttpHeaders transcriptHeaders = new HttpHeaders();
        transcriptHeaders.set("Authorization", assemblyAiKey);
        transcriptHeaders.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> transcriptEntity = new HttpEntity<>(transcriptBody, transcriptHeaders);

        ResponseEntity<String> transcriptResponse = restTemplate.exchange(
                "https://api.assemblyai.com/v2/transcript",
                HttpMethod.POST,
                transcriptEntity,
                String.class
        );

        JsonNode transcriptResponseJson = objectMapper.readTree(transcriptResponse.getBody());
        String transcriptId = transcriptResponseJson.get("id").asText();

        // 3. Poll for Completion
        HttpHeaders pollHeaders = new HttpHeaders();
        pollHeaders.set("Authorization", assemblyAiKey);
        HttpEntity<Void> pollEntity = new HttpEntity<>(pollHeaders);

        int maxRetries = 100;
        int retries = 0;

        while (retries < maxRetries) {
            ResponseEntity<String> pollResponse = restTemplate.exchange(
                    "https://api.assemblyai.com/v2/transcript/" + transcriptId,
                    HttpMethod.GET,
                    pollEntity,
                    String.class
            );

            JsonNode pollJson = objectMapper.readTree(pollResponse.getBody());
            String status = pollJson.get("status").asText();

            if ("completed".equals(status)) {
                return pollJson.get("text").asText();
            } else if ("error".equals(status)) {
                String errorMsg = pollJson.has("error") ? pollJson.get("error").asText() : "Unknown error";
                throw new RuntimeException("AssemblyAI transcription failed: " + errorMsg);
            }

            Thread.sleep(3000);
            retries++;
        }
        
        throw new RuntimeException("AssemblyAI transcription timed out after 5 minutes.");
    }

    public Map<String, String> generateSummary(String transcript) throws Exception {
        if (geminiKey == null || geminiKey.isEmpty() || geminiKey.contains("YOUR_GEMINI_KEY")) {
            throw new IllegalArgumentException("Google Gemini API key is missing or invalid.");
        }

        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiKey;
        
        String prompt = "You are an expert assistant. Read the following transcript and return a valid raw JSON object containing exactly two keys: 'title' (a short, relevant title as a string) and 'summary' (a bulleted summary of the notes, as a single formatted string with newlines, NOT a JSON array). Do not include any markdown formatting, do not wrap in backticks, return only the raw JSON text.\n\nTranscript:\n" + transcript;
        
        // Build Gemini Request JSON
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentPart = Map.of("parts", List.of(textPart));
        Map<String, Object> requestBodyMap = Map.of("contents", List.of(contentPart));
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBodyMap, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                String.class
        );
        
        JsonNode responseJson = objectMapper.readTree(response.getBody());
        JsonNode candidates = responseJson.get("candidates");
        if (candidates != null && candidates.isArray() && candidates.size() > 0) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts != null && parts.isArray() && parts.size() > 0) {
                String rawText = parts.get(0).path("text").asText();
                // Strip markdown backticks if Gemini accidentally includes them
                rawText = rawText.replaceAll("^```json\\s*", "").replaceAll("\\s*```$", "").trim();
                
                // Parse the inner JSON
                JsonNode summaryJson = objectMapper.readTree(rawText);
                Map<String, String> result = new HashMap<>();
                result.put("title", summaryJson.has("title") ? summaryJson.get("title").asText() : "Voice Note");
                
                String summaryStr = "Summary generation failed.";
                if (summaryJson.has("summary")) {
                    JsonNode summaryNode = summaryJson.get("summary");
                    if (summaryNode.isArray()) {
                        StringBuilder sb = new StringBuilder();
                        for (JsonNode node : summaryNode) {
                            sb.append("- ").append(node.asText()).append("\n");
                        }
                        summaryStr = sb.toString().trim();
                    } else {
                        summaryStr = summaryNode.asText();
                    }
                }
                result.put("summary", summaryStr);
                return result;
            }
        }
        
        throw new RuntimeException("Unexpected response format from Gemini: " + response.getBody());
    }
}
