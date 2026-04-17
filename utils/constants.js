// 预设分类常量

// 支出分类
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍔', color: '#FF6B6B' },
  { id: 'transport', name: '交通', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: '购物', icon: '🛍️', color: '#95E1D3' },
  { id: 'entertainment', name: '娱乐', icon: '🎬', color: '#F38181' },
  { id: 'medical', name: '医疗', icon: '💊', color: '#AA96DA' },
  { id: 'education', name: '教育', icon: '📚', color: '#FCBAD3' },
  { id: 'housing', name: '住房', icon: '🏠', color: '#FFA07A' },
  { id: 'utilities', name: '水电', icon: '💡', color: '#FFD93D' },
  { id: 'clothing', name: '服饰', icon: '👕', color: '#6BCB77' },
  { id: 'social', name: '社交', icon: '🎁', color: '#4D96FF' },
  { id: 'fitness', name: '运动', icon: '⚽', color: '#FF6B9D' },
  { id: 'travel', name: '旅行', icon: '✈️', color: '#C9B1FF' },
  { id: 'digital', name: '数码', icon: '📱', color: '#845EC2' },
  { id: 'pet', name: '宠物', icon: '🐱', color: '#FFC75F' },
  { id: 'other_expense', name: '其他', icon: '📝', color: '#999999' }
]

// 收入分类
export const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', icon: '💰', color: '#52C41A' },
  { id: 'bonus', name: '奖金', icon: '🎉', color: '#73D13D' },
  { id: 'investment', name: '理财', icon: '📈', color: '#95DE64' },
  { id: 'parttime', name: '兼职', icon: '💼', color: '#B7EB8F' },
  { id: 'gift', name: '红包', icon: '🧧', color: '#D9F7BE' },
  { id: 'refund', name: '退款', icon: '💸', color: '#F6FFED' },
  { id: 'other_income', name: '其他', icon: '📝', color: '#999999' }
]

// 获取所有分类
export const getAllCategories = () => {
  return {
    expense: EXPENSE_CATEGORIES,
    income: INCOME_CATEGORIES
  }
}

// 根据ID查找分类
export const getCategoryById = (categoryId) => {
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  return allCategories.find(cat => cat.id === categoryId) || { name: '未知', icon: '❓', color: '#999' }
}

// 格式化金额
export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return parseFloat(amount).toFixed(2)
}

// 格式化日期
export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取当前月份字符串
export const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 获取本月开始和结束时间戳
export const getMonthRange = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)
  return {
    start: startDate.getTime(),
    end: endDate.getTime()
  }
}
