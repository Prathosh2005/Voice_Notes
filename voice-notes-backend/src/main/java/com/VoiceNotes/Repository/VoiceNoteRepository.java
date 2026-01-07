package com.VoiceNotes.Repository;

import com.VoiceNotes.Entity.VoiceNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoiceNoteRepository extends JpaRepository<VoiceNote, Long> {

}
