package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.common.LoginDTO;
import com.zhiqin.recruitment.common.LoginVO;
import com.zhiqin.recruitment.entity.SysAdmin;

public interface SysAdminService extends IService<SysAdmin> {

    LoginVO login(LoginDTO loginDTO);

}
