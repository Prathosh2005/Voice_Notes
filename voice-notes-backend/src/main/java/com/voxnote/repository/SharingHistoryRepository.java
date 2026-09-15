package com.voxnote.repository;

import com.voxnote.entity.SharingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SharingHistoryRepository extends JpaRepository<SharingHistory, Long> {
    void deleteByNoteId(Long noteId);
}
