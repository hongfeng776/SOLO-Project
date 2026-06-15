package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.BatchIdsDTO;
import com.zhiqin.recruitment.common.PositionDetailVO;
import com.zhiqin.recruitment.common.PositionStatusDTO;
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
        IPage<Position> page = positionService.pageListWithExpireCheck(title, enterpriseId, category, city, status, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<Position> getById(@PathVariable Long id) {
        Position position = positionService.getById(id);
        return Result.success(position);
    }

    @GetMapping("/detail/{id}")
    public Result<PositionDetailVO> getDetail(@PathVariable Long id) {
        PositionDetailVO detail = positionService.getDetail(id);
        return Result.success(detail);
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

    @PutMapping("/status")
    public Result<Void> updateStatus(@RequestBody PositionStatusDTO statusDTO) {
        positionService.updateStatus(statusDTO.getIds(), statusDTO.getStatus());
        return Result.success();
    }

    @PutMapping("/online/{id}")
    public Result<Void> online(@PathVariable Long id) {
        positionService.online(id);
        return Result.success();
    }

    @PutMapping("/offline/{id}")
    public Result<Void> offline(@PathVariable Long id) {
        positionService.offline(id);
        return Result.success();
    }

}
