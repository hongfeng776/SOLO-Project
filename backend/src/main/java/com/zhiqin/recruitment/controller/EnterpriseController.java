package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.EnterpriseDetailVO;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.service.EnterpriseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enterprise")
public class EnterpriseController {

    @Autowired
    private EnterpriseService enterpriseService;

    @GetMapping("/list")
    public Result<IPage<Enterprise>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String entryTimeStart,
            @RequestParam(required = false) String entryTimeEnd,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        IPage<Enterprise> page = enterpriseService.pageList(name, industry, status, entryTimeStart, entryTimeEnd, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<Enterprise> getById(@PathVariable Long id) {
        Enterprise enterprise = enterpriseService.getById(id);
        return Result.success(enterprise);
    }

    @GetMapping("/detail/{id}")
    public Result<EnterpriseDetailVO> getDetail(@PathVariable Long id) {
        EnterpriseDetailVO vo = enterpriseService.getDetail(id);
        return Result.success(vo);
    }

    @PostMapping
    public Result<Void> add(@RequestBody Enterprise enterprise) {
        enterprise.setEntryTime(LocalDateTime.now());
        enterpriseService.save(enterprise);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Enterprise enterprise) {
        enterprise.setId(id);
        enterpriseService.updateById(enterprise);
        return Result.success();
    }

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Long> ids = (List<Long>) params.get("ids");
        Integer status = (Integer) params.get("status");
        enterpriseService.batchUpdateStatus(ids, status);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        enterpriseService.removeById(id);
        return Result.success();
    }

}
