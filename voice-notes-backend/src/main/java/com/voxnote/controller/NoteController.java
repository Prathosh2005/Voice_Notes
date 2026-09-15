package com.voxnote.controller;

import com.voxnote.entity.Note;
import com.voxnote.entity.User;
import com.voxnote.repository.NoteRepository;
import com.voxnote.repository.UserRepository;
import com.voxnote.service.AudioStorageService;
import com.voxnote.service.FreeAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.voxnote.repository.SharingHistoryRepository;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private SharingHistoryRepository sharingHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AudioStorageService audioStorageService;

    @Autowired
    private FreeAiService freeAiService;

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = "";
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }

        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            return noteRepository.findById(id)
                    .filter(note -> note.getUser().getId().equals(user.getId()))
                    .map(note -> {
                        sharingHistoryRepository.deleteByNoteId(note.getId());
                        noteRepository.delete(note);
                        return ResponseEntity.ok().build();
                    })
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete note");
        }
    }

    @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAndProcessAudio(@RequestParam("audioFile") MultipartFile file) {
        try {
            User user = getAuthenticatedUser();

            // 1. Save audio file locally
            String audioPath = audioStorageService.saveAudioFile(file);

            // 2. Call Speech-to-Text API
            String transcript = freeAiService.transcribeAudio(audioPath);

            // 3. Call LLM for Summarization
            java.util.Map<String, String> summaryData = freeAiService.generateSummary(transcript);
            String title = summaryData.getOrDefault("title", "Voice Note - " + java.time.LocalDate.now().toString());
            String summary = summaryData.getOrDefault("summary", "Summary failed.");

            // 4. Save to Database
            Note note = new Note();
            note.setUser(user);
            note.setTitle(title);
            note.setRawTranscript(transcript);
            note.setSummary(summary);
            note.setAudioUrl(audioPath);

            noteRepository.save(note);

            return ResponseEntity.ok(note);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Processing failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Note>> getUserNotes() {
        User user = getAuthenticatedUser();
        List<Note> notes = noteRepository.findByUserOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(notes);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getNoteById(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return noteRepository.findById(id)
                .filter(note -> note.getUser().getId().equals(user.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
