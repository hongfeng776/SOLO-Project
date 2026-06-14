package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.service.EnterpriseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enterprise")
public class EnterpriseController {

    @Autowired
    private EnterpriseService enterpriseService;

    @GetMapping("/list")
    public Result<IPage<Enterprise>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        IPage<Enterprise> page = enterpriseService.pageList(name, status, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<Enterprise> getById(@PathVariable Long id) {
        Enterprise enterprise = enterpriseService.getById(id);
        return Result.success(enterprise);
    }

    @PostMapping
    public Result<Void> add(@RequestBody Enterprise enterprise) {
        enterpriseService.save(enterprise);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Enterprise enterprise) {
        enterprise.setId(id);
        enterpriseService.updateById(enterprise);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        enterpriseService.removeById(id);
        return Result.success();
    }

}
