package com.VoiceNotes.Controller;
import com.VoiceNotes.Entity.VoiceNote;
import com.VoiceNotes.Repository.VoiceNoteRepository;
import com.VoiceNotes.Service.AssemblyAIService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audio")
@CrossOrigin(origins = "http://localhost:3000")

public class AudioController {

    private final AssemblyAIService assemblyAIService;
    private final VoiceNoteRepository repository;

    public AudioController(
            AssemblyAIService assemblyAIService,
            VoiceNoteRepository repository) {
        this.assemblyAIService = assemblyAIService;
        this.repository = repository;
    }

    @PostMapping("/upload")
    public Map<String, Object> upload(
            @RequestParam("file") MultipartFile file) throws Exception {

        String text = assemblyAIService.transcribe(file);

        VoiceNote note = new VoiceNote();
        note.setTranscript(text);
        note.setCreatedAt(LocalDateTime.now());
        repository.save(note);

        return Map.of(
                "text", text,
                "date", note.getCreatedAt()
        );
    }

    @GetMapping("/history")
    public List<VoiceNote> history() {
        return repository.findAll();
    }
}
