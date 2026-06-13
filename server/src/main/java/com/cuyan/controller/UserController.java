package com.cuyan.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cuyan.common.Result;
import com.cuyan.dto.BatchIdsDTO;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.UserCreateDTO;
import com.cuyan.dto.UserQueryDTO;
import com.cuyan.dto.UserUpdateDTO;
import com.cuyan.service.UserService;
import com.cuyan.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public Result<Page<UserVO>> pageQuery(UserQueryDTO queryDTO) {
        return Result.success(userService.pageQuery(queryDTO));
    }

    @GetMapping("/{id}")
    public Result<UserVO> getDetail(@PathVariable Long id) {
        return Result.success(userService.getDetail(id));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody UserCreateDTO createDTO) {
        userService.create(createDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@RequestBody UserUpdateDTO updateDTO) {
        userService.update(updateDTO);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> removeByIds(@Valid @RequestBody BatchIdsDTO batchIdsDTO) {
        userService.removeByIds(batchIdsDTO.getIds());
        return Result.success();
    }

    @PutMapping("/status")
    public Result<Void> updateStatus(@RequestParam Long id, @RequestParam Integer status) {
        userService.updateStatus(id, status);
        return Result.success();
    }
}
