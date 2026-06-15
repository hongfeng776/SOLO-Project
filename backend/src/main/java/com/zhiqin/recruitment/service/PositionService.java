package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.common.PositionDetailVO;
import com.zhiqin.recruitment.entity.Position;

import java.util.List;

public interface PositionService extends IService<Position> {

    IPage<Position> pageList(String title, Long enterpriseId, String category, String city, Integer status, Integer pageNum, Integer pageSize);

    boolean savePosition(Position position);

    boolean updatePosition(Position position);

    boolean deleteBatch(List<Long> ids);

    boolean updateStatus(List<Long> ids, Integer status);

    boolean online(Long id);

    boolean offline(Long id);

    PositionDetailVO getDetail(Long id);

    IPage<Position> pageListWithExpireCheck(String title, Long enterpriseId, String category, String city, Integer status, Integer pageNum, Integer pageSize);

}
