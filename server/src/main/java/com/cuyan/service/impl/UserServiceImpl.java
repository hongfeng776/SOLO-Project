package com.cuyan.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cuyan.common.BusinessException;
import com.cuyan.common.ResultCode;
import com.cuyan.common.UserContext;
import com.cuyan.config.JwtConfig;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.LoginDTO;
import com.cuyan.dto.UserCreateDTO;
import com.cuyan.dto.UserQueryDTO;
import com.cuyan.dto.UserUpdateDTO;
import com.cuyan.entity.Comment;
import com.cuyan.entity.Material;
import com.cuyan.entity.User;
import com.cuyan.entity.Vocabulary;
import com.cuyan.mapper.CommentMapper;
import com.cuyan.mapper.MaterialMapper;
import com.cuyan.mapper.UserMapper;
import com.cuyan.mapper.VocabularyMapper;
import com.cuyan.service.UserService;
import com.cuyan.util.JwtUtil;
import com.cuyan.vo.LoginVO;
import com.cuyan.vo.UserInfoVO;
import com.cuyan.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;
    private final StringRedisTemplate redisTemplate;
    private final VocabularyMapper vocabularyMapper;
    private final MaterialMapper materialMapper;
    private final CommentMapper commentMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        User user = getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, loginDTO.getUsername()));

        if (user == null) {
            throw new BusinessException(ResultCode.USERNAME_OR_PASSWORD_ERROR);
        }

        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.USERNAME_OR_PASSWORD_ERROR);
        }

        if (user.getStatus() != 1) {
            throw new BusinessException("账号已被禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        redisTemplate.opsForValue()
                .set("login:token:" + user.getId(), token, jwtConfig.getExpire(), TimeUnit.SECONDS);

        UserInfoVO userInfoVO = new UserInfoVO();
        BeanUtils.copyProperties(user, userInfoVO);

        return new LoginVO(token, userInfoVO);
    }

    @Override
    public void logout(String token) {
        if (token == null || token.isEmpty()) {
            return;
        }
        try {
            Long userId = jwtUtil.getUserIdFromToken(token);
            if (userId != null) {
                redisTemplate.delete("login:token:" + userId);
            }
        } catch (Exception e) {
        }
    }

    @Override
    public UserInfoVO getUserInfo() {
        Long userId = UserContext.getUserId();
        User user = getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        UserInfoVO userInfoVO = new UserInfoVO();
        BeanUtils.copyProperties(user, userInfoVO);
        return userInfoVO;
    }

    private LambdaQueryWrapper<User> buildQueryWrapper(UserQueryDTO queryDTO) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(queryDTO.getUsername()), User::getUsername, queryDTO.getUsername())
                .eq(queryDTO.getStatus() != null, User::getStatus, queryDTO.getStatus())
                .and(StringUtils.hasText(queryDTO.getKeyword()), w -> w
                        .like(User::getNickname, queryDTO.getKeyword())
                        .or().like(User::getPhone, queryDTO.getKeyword())
                        .or().like(User::getUsername, queryDTO.getKeyword()))
                .ge(queryDTO.getCreateTimeStart() != null, User::getCreateTime, queryDTO.getCreateTimeStart())
                .le(queryDTO.getCreateTimeEnd() != null, User::getCreateTime, queryDTO.getCreateTimeEnd())
                .ge(queryDTO.getLearnedWordsMin() != null, User::getLearnedWords, queryDTO.getLearnedWordsMin())
                .le(queryDTO.getLearnedWordsMax() != null, User::getLearnedWords, queryDTO.getLearnedWordsMax())
                .ge(queryDTO.getStudyDaysMin() != null, User::getStudyDays, queryDTO.getStudyDaysMin())
                .le(queryDTO.getStudyDaysMax() != null, User::getStudyDays, queryDTO.getStudyDaysMax());

        if (queryDTO.getActivityLevel() != null) {
            switch (queryDTO.getActivityLevel()) {
                case 1 -> wrapper.lt(User::getStudyDays, 5);
                case 2 -> wrapper.ge(User::getStudyDays, 5).lt(User::getStudyDays, 15);
                case 3 -> wrapper.ge(User::getStudyDays, 15).lt(User::getStudyDays, 30);
                case 4 -> wrapper.ge(User::getStudyDays, 30);
                default -> {}
            }
        }
        wrapper.orderByDesc(User::getCreateTime);
        return wrapper;
    }

    @Override
    public Page<UserVO> pageQuery(UserQueryDTO queryDTO) {
        Page<User> page = new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize());
        LambdaQueryWrapper<User> wrapper = buildQueryWrapper(queryDTO);
        Page<User> userPage = page(page, wrapper);
        Page<UserVO> voPage = new Page<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());
        List<UserVO> voList = userPage.getRecords().stream().map(user -> {
            UserVO vo = new UserVO();
            BeanUtils.copyProperties(user, vo);
            vo.setPublishCount(getPublishCount(user.getId()));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public List<UserVO> queryForExport(UserQueryDTO queryDTO) {
        LambdaQueryWrapper<User> wrapper = buildQueryWrapper(queryDTO);
        List<User> users = list(wrapper);
        return users.stream().map(user -> {
            UserVO vo = new UserVO();
            BeanUtils.copyProperties(user, vo);
            vo.setPublishCount(getPublishCount(user.getId()));
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public UserVO getDetail(Long id) {
        User user = getById(id);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        vo.setPublishCount(getPublishCount(id));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(UserCreateDTO createDTO) {
        User existUser = getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, createDTO.getUsername()));
        if (existUser != null) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        BeanUtils.copyProperties(createDTO, user);
        user.setPassword(passwordEncoder.encode(createDTO.getPassword()));
        if (user.getStatus() == null) {
            user.setStatus(1);
        }
        if (user.getStudyMinutes() == null) {
            user.setStudyMinutes(0);
        }
        if (user.getLearnedWords() == null) {
            user.setLearnedWords(0);
        }
        if (user.getStudyDays() == null) {
            user.setStudyDays(0);
        }
        if (user.getAccuracy() == null) {
            user.setAccuracy(0);
        }
        save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(UserUpdateDTO updateDTO) {
        User user = getById(updateDTO.getId());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        Integer oldStatus = user.getStatus();
        BeanUtils.copyProperties(updateDTO, user);
        updateById(user);
        if (oldStatus != null && oldStatus == 1 && updateDTO.getStatus() != null && updateDTO.getStatus() == 0) {
            disableUserRelatedData(updateDTO.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeByIds(List<Long> ids) {
        super.removeByIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        User user = getById(id);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        Integer oldStatus = user.getStatus();
        user.setStatus(status);
        updateById(user);
        if (oldStatus != null && oldStatus == 1 && status != null && status == 0) {
            disableUserRelatedData(id);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStatus(BatchStatusDTO batchStatusDTO) {
        List<Long> ids = batchStatusDTO.getIds();
        Integer status = batchStatusDTO.getStatus();
        List<User> users = listByIds(ids);
        List<Long> disableUserIds = users.stream()
                .filter(u -> u.getStatus() != null && u.getStatus() == 1 && status != null && status == 0)
                .map(User::getId)
                .collect(Collectors.toList());
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<>();
        wrapper.in(User::getId, ids).set(User::getStatus, status);
        update(wrapper);
        if (!disableUserIds.isEmpty()) {
            for (Long userId : disableUserIds) {
                disableUserRelatedData(userId);
            }
        }
    }

    private Integer getPublishCount(Long userId) {
        Long vocabCount = vocabularyMapper.selectCount(new LambdaQueryWrapper<Vocabulary>()
                .eq(Vocabulary::getCreatorId, userId)
                .eq(Vocabulary::getStatus, 1));
        Long materialCount = materialMapper.selectCount(new LambdaQueryWrapper<Material>()
                .eq(Material::getCreatorId, userId)
                .eq(Material::getStatus, 1));
        return vocabCount.intValue() + materialCount.intValue();
    }

    private void disableUserRelatedData(Long userId) {
        LambdaUpdateWrapper<Vocabulary> vocabWrapper = new LambdaUpdateWrapper<>();
        vocabWrapper.eq(Vocabulary::getCreatorId, userId).set(Vocabulary::getStatus, 0);
        vocabularyMapper.update(null, vocabWrapper);

        LambdaUpdateWrapper<Material> materialWrapper = new LambdaUpdateWrapper<>();
        materialWrapper.eq(Material::getCreatorId, userId).set(Material::getStatus, 0);
        materialMapper.update(null, materialWrapper);

        LambdaUpdateWrapper<Comment> commentWrapper = new LambdaUpdateWrapper<>();
        commentWrapper.eq(Comment::getUserId, userId).set(Comment::getStatus, 0);
        commentMapper.update(null, commentWrapper);
    }
}
