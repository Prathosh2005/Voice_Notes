package com.voxnote.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class AudioStorageService {

    @Value("${audio.storage.path}")
    private String storagePath;

    public String saveAudioFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        Path rootPath = Paths.get(storagePath);
        if (!Files.exists(rootPath)) {
            Files.createDirectories(rootPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        } else {
            // Default to m4a or wav based on content type, fallback to wav
            extension = ".wav"; 
        }

        String uniqueFilename = UUID.randomUUID().toString() + extension;
        Path destinationFile = rootPath.resolve(Paths.get(uniqueFilename)).normalize().toAbsolutePath();

        file.transferTo(destinationFile.toFile());

        // Return relative path or URL
        return storagePath + uniqueFilename;
    }
}
