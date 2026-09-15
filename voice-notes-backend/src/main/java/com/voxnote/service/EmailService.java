package com.voxnote.service;

import com.voxnote.entity.Note;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendNoteEmail(String to, Note note) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Shared Note: " + note.getTitle() + " - VoxNote AI");
        
        String body = "You have received a shared note from VoxNote AI.\n\n" +
                "==========================================\n" +
                "TITLE: " + note.getTitle() + "\n" +
                "==========================================\n\n" +
                "SUMMARY:\n" + note.getSummary() + "\n\n" +
                "==========================================\n" +
                "TRANSCRIPT:\n" + note.getRawTranscript() + "\n\n" +
                "Shared via VoxNote AI.";
                
        message.setText(body);
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            // Depending on requirements, we can rethrow or handle silently if SMTP is not configured
        }
    }
}
