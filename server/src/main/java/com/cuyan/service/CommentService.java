package com.cuyan.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.CommentQueryDTO;
import com.cuyan.entity.Comment;
import com.cuyan.vo.CommentVO;

import java.util.List;

public interface CommentService extends IService<Comment> {

    Page<CommentVO> pageQuery(CommentQueryDTO queryDTO);

    void updateStatus(Long id, Integer status);

    void batchUpdateStatus(BatchStatusDTO batchStatusDTO);

    void removeByIds(List<Long> ids);
}
