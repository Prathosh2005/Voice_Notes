package com.VoiceNotes.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class AssemblyAIService {

    @Value("${assemblyai.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // 🔹 THIS is the method your controller needs
    public String transcribe(MultipartFile file) throws Exception {

        // 1️⃣ Upload audio
        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.set("authorization", apiKey);
        uploadHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> uploadRequest =
                new HttpEntity<>(file.getBytes(), uploadHeaders);

        ResponseEntity<Map> uploadResponse = restTemplate.exchange(
                "https://api.assemblyai.com/v2/upload",
                HttpMethod.POST,
                uploadRequest,
                Map.class
        );

        String uploadUrl = uploadResponse.getBody().get("upload_url").toString();

        // 2️⃣ Start transcription
        HttpHeaders transcriptHeaders = new HttpHeaders();
        transcriptHeaders.set("authorization", apiKey);
        transcriptHeaders.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> transcriptBody = new HashMap<>();
        transcriptBody.put("audio_url", uploadUrl);

        HttpEntity<Map<String, Object>> transcriptRequest =
                new HttpEntity<>(transcriptBody, transcriptHeaders);

        ResponseEntity<Map> transcriptResponse = restTemplate.postForEntity(
                "https://api.assemblyai.com/v2/transcript",
                transcriptRequest,
                Map.class
        );

        String transcriptId =
                transcriptResponse.getBody().get("id").toString();

        // 3️⃣ Poll result
        return pollTranscript(transcriptId);
    }

    private String pollTranscript(String id) throws InterruptedException {

        HttpHeaders headers = new HttpHeaders();
        headers.set("authorization", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        int attempts = 0;

        while (attempts < 20) {
            attempts++;

            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.assemblyai.com/v2/transcript/" + id,
                    HttpMethod.GET,
                    request,
                    Map.class
            );

            String status = response.getBody().get("status").toString();

            if ("completed".equals(status)) {
                return response.getBody().get("text").toString();
            }

            if ("error".equals(status)) {
                throw new RuntimeException("Transcription failed");
            }

            Thread.sleep(3000);
        }

        throw new RuntimeException("Transcription timeout");
    }
}
