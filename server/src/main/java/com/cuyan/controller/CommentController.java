package com.cuyan.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cuyan.common.Result;
import com.cuyan.dto.BatchIdsDTO;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.CommentQueryDTO;
import com.cuyan.service.CommentService;
import com.cuyan.vo.CommentVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public Result<Page<CommentVO>> pageQuery(CommentQueryDTO queryDTO) {
        return Result.success(commentService.pageQuery(queryDTO));
    }

    @PutMapping("/status")
    public Result<Void> updateStatus(@RequestParam Long id, @RequestParam Integer status) {
        commentService.updateStatus(id, status);
        return Result.success();
    }

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@Valid @RequestBody BatchStatusDTO batchStatusDTO) {
        commentService.batchUpdateStatus(batchStatusDTO);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> removeByIds(@Valid @RequestBody BatchIdsDTO batchIdsDTO) {
        commentService.removeByIds(batchIdsDTO.getIds());
        return Result.success();
    }
}
