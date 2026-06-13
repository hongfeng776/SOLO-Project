package com.cuyan.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cuyan.common.Result;
import com.cuyan.dto.BatchIdsDTO;
import com.cuyan.dto.ViolationCreateDTO;
import com.cuyan.dto.ViolationHandleDTO;
import com.cuyan.dto.ViolationQueryDTO;
import com.cuyan.service.ViolationService;
import com.cuyan.vo.ViolationVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/violation")
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationService violationService;

    @GetMapping
    public Result<Page<ViolationVO>> pageQuery(ViolationQueryDTO queryDTO) {
        return Result.success(violationService.pageQuery(queryDTO));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody ViolationCreateDTO createDTO) {
        violationService.create(createDTO);
        return Result.success();
    }

    @PutMapping("/handle")
    public Result<Void> handle(@RequestBody ViolationHandleDTO handleDTO) {
        violationService.handle(handleDTO);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> removeByIds(@Valid @RequestBody BatchIdsDTO batchIdsDTO) {
        violationService.removeByIds(batchIdsDTO.getIds());
        return Result.success();
    }
}
