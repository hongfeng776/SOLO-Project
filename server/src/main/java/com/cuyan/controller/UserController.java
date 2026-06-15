package com.cuyan.controller;

import cn.hutool.core.date.DateUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cuyan.common.Result;
import com.cuyan.dto.BatchIdsDTO;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.UserCreateDTO;
import com.cuyan.dto.UserQueryDTO;
import com.cuyan.dto.UserUpdateDTO;
import com.cuyan.service.UserService;
import com.cuyan.vo.UserVO;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@Valid @RequestBody BatchStatusDTO batchStatusDTO) {
        userService.batchUpdateStatus(batchStatusDTO);
        return Result.success();
    }

    @GetMapping("/export")
    public void exportUsers(UserQueryDTO queryDTO, HttpServletResponse response) throws Exception {
        List<UserVO> userList = userService.queryForExport(queryDTO);

        List<Map<String, Object>> rows = userList.stream().map(vo -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("ID", vo.getId());
            row.put("账号", vo.getUsername());
            row.put("昵称", vo.getNickname());
            row.put("手机号", vo.getPhone());
            row.put("邮箱", vo.getEmail());
            row.put("已学单词数", vo.getLearnedWords());
            row.put("学习时长(分钟)", vo.getStudyMinutes());
            row.put("学习天数", vo.getStudyDays());
            row.put("正确率(%)", vo.getAccuracy());
            row.put("发布内容数", vo.getPublishCount());
            row.put("状态", vo.getStatus() == 1 ? "启用" : "禁用");
            row.put("注册时间", vo.getCreateTime() != null ? vo.getCreateTime().toString().replace("T", " ") : "");
            return row;
        }).collect(Collectors.toList());

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(rows, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = "用户数据_" + DateUtil.format(DateUtil.date(), "yyyyMMdd_HHmmss") + ".xlsx";
        response.setHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(fileName, "UTF-8"));

        writer.flush(response.getOutputStream(), true);
        writer.close();
    }
}
