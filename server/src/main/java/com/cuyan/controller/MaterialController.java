package com.cuyan.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cuyan.common.Result;
import com.cuyan.dto.BatchIdsDTO;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.MaterialCreateDTO;
import com.cuyan.dto.MaterialQueryDTO;
import com.cuyan.dto.MaterialUpdateDTO;
import com.cuyan.service.MaterialService;
import com.cuyan.vo.MaterialVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/material")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    public Result<Page<MaterialVO>> pageQuery(MaterialQueryDTO queryDTO) {
        return Result.success(materialService.pageQuery(queryDTO));
    }

    @GetMapping("/{id}")
    public Result<MaterialVO> getDetail(@PathVariable Long id) {
        return Result.success(materialService.getDetail(id));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody MaterialCreateDTO createDTO) {
        materialService.create(createDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@RequestBody MaterialUpdateDTO updateDTO) {
        materialService.update(updateDTO);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> removeByIds(@Valid @RequestBody BatchIdsDTO batchIdsDTO) {
        materialService.removeByIds(batchIdsDTO.getIds());
        return Result.success();
    }

    @PutMapping("/status")
    public Result<Void> updateStatus(@RequestParam Long id, @RequestParam Integer status) {
        materialService.updateStatus(id, status);
        return Result.success();
    }

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@Valid @RequestBody BatchStatusDTO batchStatusDTO) {
        materialService.batchUpdateStatus(batchStatusDTO);
        return Result.success();
    }
}
