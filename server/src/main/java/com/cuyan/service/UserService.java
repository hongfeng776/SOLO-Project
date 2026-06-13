package com.cuyan.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.LoginDTO;
import com.cuyan.dto.UserCreateDTO;
import com.cuyan.dto.UserQueryDTO;
import com.cuyan.dto.UserUpdateDTO;
import com.cuyan.entity.User;
import com.cuyan.vo.LoginVO;
import com.cuyan.vo.UserInfoVO;
import com.cuyan.vo.UserVO;

import java.util.List;

public interface UserService extends IService<User> {

    LoginVO login(LoginDTO loginDTO);

    void logout(String token);

    UserInfoVO getUserInfo();

    Page<UserVO> pageQuery(UserQueryDTO queryDTO);

    UserVO getDetail(Long id);

    void create(UserCreateDTO createDTO);

    void update(UserUpdateDTO updateDTO);

    void removeByIds(List<Long> ids);

    void updateStatus(Long id, Integer status);

    void batchUpdateStatus(BatchStatusDTO batchStatusDTO);
}
