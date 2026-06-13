package com.cuyan.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.dto.LoginDTO;
import com.cuyan.entity.User;
import com.cuyan.vo.LoginVO;
import com.cuyan.vo.UserInfoVO;

public interface UserService extends IService<User> {

    LoginVO login(LoginDTO loginDTO);

    void logout();

    UserInfoVO getUserInfo();
}
