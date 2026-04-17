// 数据存储工具函数

import { getCurrentMonth, getMonthRange, formatDate } from './constants.js'

const STORAGE_KEYS = {
  RECORDS: 'ledgerRecords',
  BUDGET: 'ledgerBudget',
  CUSTOM_CATEGORIES: 'ledgerCustomCategories'
}

// 保存交易记录
export const saveRecords = (records) => {
  try {
    uni.setStorageSync(STORAGE_KEYS.RECORDS, records)
    return true
  } catch (error) {
    console.error('保存记录失败:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
    return false
  }
}

// 获取所有交易记录
export const getRecords = () => {
  try {
    const records = uni.getStorageSync(STORAGE_KEYS.RECORDS)
    return records || []
  } catch (error) {
    console.error('获取记录失败:', error)
    return []
  }
}

// 添加交易记录
export const addRecord = (record) => {
  const records = getRecords()
  const newRecord = {
    ...record,
    id: Date.now().toString(),
    timestamp: record.timestamp || Date.now()
  }
  records.unshift(newRecord)
  saveRecords(records)
  return newRecord
}

// 更新交易记录
export const updateRecord = (recordId, updates) => {
  const records = getRecords()
  const index = records.findIndex(r => r.id === recordId)
  if (index !== -1) {
    records[index] = { ...records[index], ...updates }
    saveRecords(records)
    return true
  }
  return false
}

// 删除交易记录
export const deleteRecord = (recordId) => {
  const records = getRecords()
  const filtered = records.filter(r => r.id !== recordId)
  saveRecords(filtered)
  return filtered.length !== records.length
}

// 根据ID获取单条记录
export const getRecordById = (recordId) => {
  const records = getRecords()
  return records.find(r => r.id === recordId) || null
}

// 获取本月记录
export const getCurrentMonthRecords = () => {
  const records = getRecords()
  const currentMonth = getCurrentMonth()
  const { start, end } = getMonthRange(currentMonth)
  
  return records.filter(record => {
    const timestamp = record.timestamp
    return timestamp >= start && timestamp <= end
  })
}

// 按日期范围筛选记录
export const getRecordsByDateRange = (startDate, endDate) => {
  const records = getRecords()
  return records.filter(record => {
    const timestamp = record.timestamp
    return timestamp >= startDate && timestamp <= endDate
  })
}

// 按分类筛选记录
export const getRecordsByCategory = (categoryId) => {
  const records = getRecords()
  return records.filter(record => record.categoryId === categoryId)
}

// 搜索记录
export const searchRecords = (options = {}) => {
  let records = getRecords()
  
  // 关键词搜索
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase()
    records = records.filter(record => 
      (record.note && record.note.toLowerCase().includes(keyword)) ||
      record.category.toLowerCase().includes(keyword)
    )
  }
  
  // 类型筛选
  if (options.type) {
    records = records.filter(record => record.type === options.type)
  }
  
  // 分类筛选
  if (options.categoryId) {
    records = records.filter(record => record.categoryId === options.categoryId)
  }
  
  // 日期范围筛选
  if (options.startDate) {
    records = records.filter(record => record.timestamp >= options.startDate)
  }
  if (options.endDate) {
    records = records.filter(record => record.timestamp <= options.endDate)
  }
  
  // 金额范围筛选
  if (options.minAmount !== undefined) {
    records = records.filter(record => record.amount >= options.minAmount)
  }
  if (options.maxAmount !== undefined) {
    records = records.filter(record => record.amount <= options.maxAmount)
  }
  
  // 按时间戳降序排序
  records.sort((a, b) => b.timestamp - a.timestamp)
  
  return records
}

// 保存预算
export const saveBudget = (budget) => {
  try {
    const budgets = getBudgets()
    const index = budgets.findIndex(b => b.month === budget.month)
    
    if (index !== -1) {
      budgets[index] = budget
    } else {
      budgets.push(budget)
    }
    
    uni.setStorageSync(STORAGE_KEYS.BUDGET, budgets)
    return true
  } catch (error) {
    console.error('保存预算失败:', error)
    return false
  }
}

// 获取所有预算
export const getBudgets = () => {
  try {
    const budgets = uni.getStorageSync(STORAGE_KEYS.BUDGET)
    return budgets || []
  } catch (error) {
    return []
  }
}

// 获取指定月份的预算
export const getBudgetByMonth = (month) => {
  const budgets = getBudgets()
  return budgets.find(b => b.month === month) || null
}

// 获取当前月份预算
export const getCurrentBudget = () => {
  const currentMonth = getCurrentMonth()
  return getBudgetByMonth(currentMonth)
}

// 计算本月支出总额
export const getCurrentMonthExpense = () => {
  const records = getCurrentMonthRecords()
  return records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)
}

// 计算本月收入总额
export const getCurrentMonthIncome = () => {
  const records = getCurrentMonthRecords()
  return records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)
}

// 获取分类支出统计
export const getCategoryStats = (month) => {
  const monthStr = month || getCurrentMonth()
  const { start, end } = getMonthRange(monthStr)
  const records = getRecordsByDateRange(start, end)
  
  const expenseRecords = records.filter(r => r.type === 'expense')
  const stats = {}
  
  expenseRecords.forEach(record => {
    const catId = record.categoryId
    if (!stats[catId]) {
      stats[catId] = {
        categoryId: catId,
        categoryName: record.category,
        amount: 0,
        count: 0
      }
    }
    stats[catId].amount += parseFloat(record.amount)
    stats[catId].count += 1
  })
  
  // 转换为数组并按金额降序排序
  return Object.values(stats).sort((a, b) => b.amount - a.amount)
}

// 获取每日收支趋势
export const getDailyTrend = (days = 7) => {
  const now = Date.now()
  const startDate = now - (days - 1) * 24 * 60 * 60 * 1000
  
  const records = getRecordsByDateRange(startDate, now)
  const trend = {}
  
  // 初始化每天的数据
  for (let i = 0; i < days; i++) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const dateStr = formatDate(date.getTime())
    trend[dateStr] = { income: 0, expense: 0 }
  }
  
  // 统计数据
  records.forEach(record => {
    const dateStr = formatDate(record.timestamp)
    if (trend[dateStr]) {
      if (record.type === 'income') {
        trend[dateStr].income += parseFloat(record.amount)
      } else {
        trend[dateStr].expense += parseFloat(record.amount)
      }
    }
  })
  
  // 转换为数组并反转(按时间正序)
  return Object.entries(trend)
    .map(([date, data]) => ({ date, ...data }))
    .reverse()
}

// 保存自定义分类
export const saveCustomCategories = (categories) => {
  try {
    uni.setStorageSync(STORAGE_KEYS.CUSTOM_CATEGORIES, categories)
    return true
  } catch (error) {
    console.error('保存自定义分类失败:', error)
    return false
  }
}

// 获取自定义分类
export const getCustomCategories = () => {
  try {
    const categories = uni.getStorageSync(STORAGE_KEYS.CUSTOM_CATEGORIES)
    return categories || []
  } catch (error) {
    return []
  }
}
