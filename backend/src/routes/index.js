const express = require('express')
const router = express.Router()

const authRoutes = require('./auth')
const resourceRoutes = require('./resources')
const templateRoutes = require('./templates')
const auditRoutes = require('./audit')
const userRoutes = require('./users')
const memberRoutes = require('./members')
const categoryRoutes = require('./categories')
const dashboardRoutes = require('./dashboard')

router.use('/auth', authRoutes)
router.use('/resources', resourceRoutes)
router.use('/templates', templateRoutes)
router.use('/audit', auditRoutes)
router.use('/users', userRoutes)
router.use('/members', memberRoutes)
router.use('/categories', categoryRoutes)
router.use('/dashboard', dashboardRoutes)

module.exports = router
