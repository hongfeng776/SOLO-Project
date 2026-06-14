package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.entity.Violation;
import com.zhiqin.recruitment.service.ViolationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/violation")
public class ViolationController {

    @Autowired
    private ViolationService violationService;

    @GetMapping("/list")
    public Result<IPage<Violation>> list(
            @RequestParam(required = false) String targetName,
            @RequestParam(required = false) Integer targetType,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) Integer handleStatus,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        IPage<Violation> page = violationService.pageList(targetName, targetType, type, handleStatus, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<Violation> getById(@PathVariable Long id) {
        Violation violation = violationService.getById(id);
        return Result.success(violation);
    }

    @PostMapping
    public Result<Void> add(@RequestBody Violation violation) {
        violationService.save(violation);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Violation violation) {
        violation.setId(id);
        violationService.updateById(violation);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        violationService.removeById(id);
        return Result.success();
    }

}
