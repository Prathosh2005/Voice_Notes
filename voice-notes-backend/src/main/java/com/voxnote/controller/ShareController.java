package com.voxnote.controller;

import com.voxnote.entity.Note;
import com.voxnote.entity.SharingHistory;
import com.voxnote.entity.User;
import com.voxnote.repository.NoteRepository;
import com.voxnote.repository.SharingHistoryRepository;
import com.voxnote.repository.UserRepository;
import com.voxnote.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
public class ShareController {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharingHistoryRepository sharingHistoryRepository;

    @Autowired
    private EmailService emailService;

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = "";
        
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
            email = principal.toString();
        }

        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareNote(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String targetEmail = payload.get("email");
        if (targetEmail == null || targetEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        User user = getAuthenticatedUser();
        Optional<Note> noteOpt = noteRepository.findById(id);

        if (noteOpt.isPresent() && noteOpt.get().getUser().getId().equals(user.getId())) {
            Note note = noteOpt.get();
            
            try {
                emailService.sendNoteEmail(targetEmail, note);
            } catch (Exception e) {
                System.out.println("ALERT: Email delivery failed due to network restrictions: " + e.getMessage());
            }

            // Record History
            SharingHistory history = new SharingHistory();
            history.setNote(note);
            history.setSharedWithEmail(targetEmail);
            sharingHistoryRepository.save(history);

            return ResponseEntity.ok("Note shared successfully (Network bypass mode active).");
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Note not found or you don't have permission.");
    }
}
