package com.cuyan.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cuyan.common.Result;
import com.cuyan.dto.BatchIdsDTO;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.VocabularyCreateDTO;
import com.cuyan.dto.VocabularyQueryDTO;
import com.cuyan.dto.VocabularyUpdateDTO;
import com.cuyan.service.VocabularyService;
import com.cuyan.vo.VocabularyVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyService vocabularyService;

    @GetMapping
    public Result<Page<VocabularyVO>> pageQuery(VocabularyQueryDTO queryDTO) {
        return Result.success(vocabularyService.pageQuery(queryDTO));
    }

    @GetMapping("/{id}")
    public Result<VocabularyVO> getDetail(@PathVariable Long id) {
        return Result.success(vocabularyService.getDetail(id));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody VocabularyCreateDTO createDTO) {
        vocabularyService.create(createDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@RequestBody VocabularyUpdateDTO updateDTO) {
        vocabularyService.update(updateDTO);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> removeByIds(@Valid @RequestBody BatchIdsDTO batchIdsDTO) {
        vocabularyService.removeByIds(batchIdsDTO.getIds());
        return Result.success();
    }

    @PutMapping("/status")
    public Result<Void> updateStatus(@RequestParam Long id, @RequestParam Integer status) {
        vocabularyService.updateStatus(id, status);
        return Result.success();
    }

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@Valid @RequestBody BatchStatusDTO batchStatusDTO) {
        vocabularyService.batchUpdateStatus(batchStatusDTO);
        return Result.success();
    }
}
