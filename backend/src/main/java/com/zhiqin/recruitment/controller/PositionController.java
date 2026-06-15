package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.BatchIdsDTO;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.entity.Position;
import com.zhiqin.recruitment.service.PositionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/position")
public class PositionController {

    @Autowired
    private PositionService positionService;

    @GetMapping("/list")
    public Result<IPage<Position>> list(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long enterpriseId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        IPage<Position> page = positionService.pageList(title, enterpriseId, category, city, status, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<Position> getById(@PathVariable Long id) {
        Position position = positionService.getById(id);
        return Result.success(position);
    }

    @PostMapping
    public Result<Void> add(@RequestBody Position position) {
        positionService.savePosition(position);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Position position) {
        position.setId(id);
        positionService.updatePosition(position);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        positionService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> deleteBatch(@RequestBody BatchIdsDTO batchIdsDTO) {
        positionService.deleteBatch(batchIdsDTO.getIds());
        return Result.success();
    }

}
