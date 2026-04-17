<template>
	<view class="page">
		<!-- 月份选择 -->
		<view class="month-selector">
			<picker mode="date" :value="selectedMonth" fields="month" @change="onMonthChange">
				<view class="month-picker">
					<text class="month-text">{{selectedMonth}}</text>
					<text class="arrow">▼</text>
				</view>
			</picker>
		</view>

		<!-- 总预算卡片 -->
		<view class="budget-card">
			<view class="budget-header">
				<text class="budget-title">月度总预算</text>
				<button class="edit-btn" @click="showEditBudget">编辑</button>
			</view>

			<view class="budget-amount">
				<text class="currency">¥</text>
				<text class="amount">{{formatAmount(budgetAmount)}}</text>
			</view>

			<view class="budget-progress">
				<view class="progress-bar">
					<view
						class="progress-fill"
						:style="{ width: progressPercent + '%', backgroundColor: progressColor }"
					></view>
				</view>
				<view class="progress-info">
					<text class="spent">已支出 {{formatAmount(currentExpense)}}</text>
					<text class="percent" :class="progressClass">{{progressPercent}}%</text>
				</view>
			</view>

			<view v-if="remaining > 0" class="budget-remaining">
				<text class="remaining-label">剩余可用</text>
				<text class="remaining-amount">{{formatAmount(remaining)}}</text>
			</view>
			<view v-else class="budget-over">
				<text class="over-icon">⚠️</text>
				<text class="over-text">已超支 {{formatAmount(Math.abs(remaining))}}</text>
			</view>
		</view>

		<!-- 预警提示 -->
		<view v-if="warningMessage" class="warning-banner" :class="warningType">
			<text class="warning-icon">{{warningType === 'danger' ? '🔴' : '🟡'}}</text>
			<text class="warning-text">{{warningMessage}}</text>
		</view>

		<!-- 分类预算 -->
		<view class="category-budget-section">
			<view class="section-header">
				<text class="section-title">分类预算</text>
				<button class="add-btn" @click="showAddCategoryBudget">+ 添加</button>
			</view>

			<view v-if="categoryBudgets.length === 0" class="empty-category">
				<text class="empty-icon">💰</text>
				<text class="empty-text">暂未设置分类预算</text>
			</view>

			<view v-else class="category-budget-list">
				<view
					v-for="(item, index) in categoryBudgets"
					:key="item.categoryId"
					class="category-budget-item"
				>
					<view class="cat-header">
						<view class="cat-info">
							<text class="cat-icon">{{getCategoryIcon(item.categoryId)}}</text>
							<text class="cat-name">{{item.categoryName}}</text>
						</view>
						<button class="delete-btn" @click="deleteCategoryBudget(index)">删除</button>
					</view>

					<view class="cat-budget-info">
						<text class="cat-budget-label">预算: ¥{{formatAmount(item.budget)}}</text>
						<text class="cat-spent">已用: ¥{{formatAmount(item.spent)}}</text>
					</view>

					<view class="cat-progress">
						<view class="cat-progress-bar">
							<view
								class="cat-progress-fill"
								:style="{ width: item.percent + '%', backgroundColor: getProgressColor(item.percent) }"
							></view>
						</view>
						<text class="cat-percent">{{item.percent}}%</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 编辑总预算弹窗 -->
		<view v-if="showBudgetModal" class="modal-overlay" @click="closeBudgetPopup">
			<view class="popup-content" @click.stop>
				<text class="popup-title">设置月度预算</text>
				<input
					type="digit"
					v-model="editBudgetAmount"
					placeholder="请输入预算金额"
					class="popup-input"
				/>
				<view class="popup-buttons">
					<button class="cancel-btn" @click="closeBudgetPopup">取消</button>
					<button class="confirm-btn" @click="saveBudget">确定</button>
				</view>
			</view>
		</view>

		<!-- 添加分类预算弹窗 -->
		<view v-if="showCategoryBudgetModal" class="modal-overlay" @click="closeCategoryBudgetPopup">
			<view class="popup-content" @click.stop>
				<text class="popup-title">设置分类预算</text>
				<picker :range="availableCategories" range-key="name" @change="onCategorySelect">
					<view class="picker-field">
						<text v-if="selectedCatId" class="selected-cat">
							{{getCategoryIcon(selectedCatId)}} {{getCategoryName(selectedCatId)}}
						</text>
						<text v-else class="placeholder">选择分类</text>
					</view>
				</picker>
				<input
					type="digit"
					v-model="categoryBudgetAmount"
					placeholder="预算金额"
					class="popup-input"
				/>
				<view class="popup-buttons">
					<button class="cancel-btn" @click="closeCategoryBudgetPopup">取消</button>
					<button class="confirm-btn" @click="saveCategoryBudget">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { formatAmount, getCategoryById, EXPENSE_CATEGORIES } from '@/utils/constants.js'
import { getBudgetByMonth, saveBudget, getCurrentMonthExpense, getCategoryStats } from '@/utils/storage.js'

export default {
	data() {
		return {
			selectedMonth: this.getCurrentMonthStr(),
			budgetAmount: 0,
			currentExpense: 0,
			categoryBudgets: [],
			editBudgetAmount: '',
			selectedCatId: '',
			categoryBudgetAmount: '',
			showBudgetModal: false,
			showCategoryBudgetModal: false
		}
	},

	computed: {
		remaining() {
			return this.budgetAmount - this.currentExpense
		},
		progressPercent() {
			if (this.budgetAmount === 0) return 0
			return Math.min(Math.round((this.currentExpense / this.budgetAmount) * 100), 100)
		},
		progressColor() {
			if (this.progressPercent >= 100) return '#FF4D4F'
			if (this.progressPercent >= 80) return '#FAAD14'
			return '#52C41A'
		},
		progressClass() {
			if (this.progressPercent >= 100) return 'danger'
			if (this.progressPercent >= 80) return 'warning'
			return 'normal'
		},
		warningMessage() {
			if (this.budgetAmount === 0) return ''
			if (this.progressPercent >= 100) {
				return '预算已用完，请注意控制支出'
			}
			if (this.progressPercent >= 80) {
				return '预算使用已超过80%，请合理消费'
			}
			return ''
		},
		warningType() {
			if (this.progressPercent >= 100) return 'danger'
			if (this.progressPercent >= 80) return 'warning'
			return ''
		},
		availableCategories() {
			return EXPENSE_CATEGORIES.filter(cat =>
				!this.categoryBudgets.some(cb => cb.categoryId === cat.id)
			)
		}
	},

	onShow() {
		this.loadData()
	},

	methods: {
		formatAmount,

		getCurrentMonthStr() {
			const now = new Date()
			const year = now.getFullYear()
			const month = String(now.getMonth() + 1).padStart(2, '0')
			return `${year}-${month}`
		},

		onMonthChange(e) {
			this.selectedMonth = e.detail.value
			this.loadData()
		},

		loadData() {
			const budget = getBudgetByMonth(this.selectedMonth)
			this.budgetAmount = budget ? budget.totalBudget : 0
			this.currentExpense = getCurrentMonthExpense()

			// 加载分类预算
			if (budget && budget.categoryBudgets) {
				const stats = getCategoryStats(this.selectedMonth)
				this.categoryBudgets = Object.entries(budget.categoryBudgets).map(([catId, amount]) => {
					const spent = stats.find(s => s.categoryId === catId)?.amount || 0
					const percent = amount > 0 ? Math.min(Math.round((spent / amount) * 100), 100) : 0
					return {
						categoryId: catId,
						categoryName: getCategoryById(catId).name,
						budget: amount,
						spent: spent,
						percent: percent
					}
				})
			} else {
				this.categoryBudgets = []
			}
		},

		showEditBudget() {
			this.editBudgetAmount = this.budgetAmount > 0 ? String(this.budgetAmount) : ''
			this.showBudgetModal = true
		},

		closeBudgetPopup() {
			this.showBudgetModal = false
		},

		saveBudget() {
			const amount = parseFloat(this.editBudgetAmount)
			if (!amount || amount <= 0) {
				uni.showToast({ title: '请输入有效金额', icon: 'none' })
				return
			}

			const budget = {
				month: this.selectedMonth,
				totalBudget: amount,
				categoryBudgets: {}
			}

			// 保留现有的分类预算
			const existingBudget = getBudgetByMonth(this.selectedMonth)
			if (existingBudget && existingBudget.categoryBudgets) {
				budget.categoryBudgets = existingBudget.categoryBudgets
			}

			saveBudget(budget)
			this.closeBudgetPopup()
			this.loadData()
			uni.showToast({ title: '保存成功', icon: 'success' })
		},

		showAddCategoryBudget() {
			if (this.availableCategories.length === 0) {
				uni.showToast({ title: '所有分类已设置', icon: 'none' })
				return
			}
			this.selectedCatId = ''
			this.categoryBudgetAmount = ''
			this.showCategoryBudgetModal = true
		},

		closeCategoryBudgetPopup() {
			this.showCategoryBudgetModal = false
		},

		onCategorySelect(e) {
			const index = e.detail.value
			this.selectedCatId = this.availableCategories[index].id
		},

		saveCategoryBudget() {
			if (!this.selectedCatId) {
				uni.showToast({ title: '请选择分类', icon: 'none' })
				return
			}

			const amount = parseFloat(this.categoryBudgetAmount)
			if (!amount || amount <= 0) {
				uni.showToast({ title: '请输入有效金额', icon: 'none' })
				return
			}

			const budget = getBudgetByMonth(this.selectedMonth) || {
				month: this.selectedMonth,
				totalBudget: this.budgetAmount,
				categoryBudgets: {}
			}

			budget.categoryBudgets[this.selectedCatId] = amount
			saveBudget(budget)
			this.closeCategoryBudgetPopup()
			this.loadData()
			uni.showToast({ title: '保存成功', icon: 'success' })
		},

		deleteCategoryBudget(index) {
			const item = this.categoryBudgets[index]
			uni.showModal({
				title: '提示',
				content: `确定要删除${item.categoryName}的预算吗？`,
				success: (res) => {
					if (res.confirm) {
						const budget = getBudgetByMonth(this.selectedMonth)
						if (budget && budget.categoryBudgets) {
							delete budget.categoryBudgets[item.categoryId]
							saveBudget(budget)
							this.loadData()
							uni.showToast({ title: '已删除', icon: 'success' })
						}
					}
				}
			})
		},

		getCategoryIcon(categoryId) {
			return getCategoryById(categoryId).icon
		},

		getCategoryName(categoryId) {
			return getCategoryById(categoryId).name
		},

		getProgressColor(percent) {
			if (percent >= 100) return '#FF4D4F'
			if (percent >= 80) return '#FAAD14'
			return '#52C41A'
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-color: #F5F5F5;
	padding-bottom: 20rpx;
}

/* 月份选择 */
.month-selector {
	padding: 20rpx;
}

.month-picker {
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #FFFFFF;
	padding: 24rpx;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.month-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-right: 10rpx;
}

.arrow {
	font-size: 20rpx;
	color: #999;
}

/* 预算卡片 */
.budget-card {
	background-color: #FFFFFF;
	margin: 0 20rpx 20rpx;
	padding: 40rpx 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.budget-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.budget-title {
	font-size: 28rpx;
	color: #666;
}

.edit-btn {
	padding: 10rpx 24rpx;
	font-size: 24rpx;
	color: #1890FF;
	background-color: transparent;
	border: 1rpx solid #1890FF;
	border-radius: 8rpx;
}

.budget-amount {
	text-align: center;
	margin-bottom: 40rpx;
}

.currency {
	font-size: 32rpx;
	color: #333;
	margin-right: 8rpx;
}

.amount {
	font-size: 72rpx;
	font-weight: bold;
	color: #333;
}

.budget-progress {
	margin-bottom: 30rpx;
}

.progress-bar {
	height: 20rpx;
	background-color: #F0F0F0;
	border-radius: 10rpx;
	overflow: hidden;
	margin-bottom: 16rpx;
}

.progress-fill {
	height: 100%;
	border-radius: 10rpx;
	transition: width 0.3s, background-color 0.3s;
}

.progress-info {
	display: flex;
	justify-content: space-between;
}

.spent {
	font-size: 26rpx;
	color: #666;
}

.percent {
	font-size: 26rpx;
	font-weight: bold;
}

.percent.normal {
	color: #52C41A;
}

.percent.warning {
	color: #FAAD14;
}

.percent.danger {
	color: #FF4D4F;
}

.budget-remaining, .budget-over {
	text-align: center;
	padding: 30rpx;
	background-color: #F6FFED;
	border-radius: 12rpx;
}

.budget-over {
	background-color: #FFF1F0;
}

.remaining-label {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin-bottom: 8rpx;
}

.remaining-amount {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #52C41A;
}

.over-icon {
	display: block;
	font-size: 48rpx;
	margin-bottom: 12rpx;
}

.over-text {
	display: block;
	font-size: 28rpx;
	color: #FF4D4F;
	font-weight: bold;
}

/* 预警横幅 */
.warning-banner {
	display: flex;
	align-items: center;
	margin: 0 20rpx 20rpx;
	padding: 24rpx 30rpx;
	border-radius: 12rpx;
}

.warning-banner.warning {
	background-color: #FFFBE6;
	border: 1rpx solid #FFE58F;
}

.warning-banner.danger {
	background-color: #FFF1F0;
	border: 1rpx solid #FFCCC7;
}

.warning-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
}

.warning-text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

/* 分类预算 */
.category-budget-section {
	background-color: #FFFFFF;
	margin: 0 20rpx 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.add-btn {
	padding: 10rpx 24rpx;
	font-size: 24rpx;
	color: #FFFFFF;
	background-color: #1890FF;
	border: none;
	border-radius: 8rpx;
}

.empty-category {
	text-align: center;
	padding: 80rpx 0;
}

.empty-icon {
	display: block;
	font-size: 80rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

.category-budget-list {
	margin-top: 20rpx;
}

.category-budget-item {
	padding: 30rpx 0;
	border-bottom: 1rpx solid #F0F0F0;
}

.category-budget-item:last-child {
	border-bottom: none;
}

.cat-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.cat-info {
	display: flex;
	align-items: center;
}

.cat-icon {
	font-size: 36rpx;
	margin-right: 12rpx;
}

.cat-name {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.delete-btn {
	padding: 8rpx 20rpx;
	font-size: 22rpx;
	color: #FF4D4F;
	background-color: transparent;
	border: 1rpx solid #FF4D4F;
	border-radius: 6rpx;
}

.cat-budget-info {
	display: flex;
	justify-content: space-between;
	margin-bottom: 16rpx;
}

.cat-budget-label {
	font-size: 24rpx;
	color: #666;
}

.cat-spent {
	font-size: 24rpx;
	color: #666;
}

.cat-progress {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.cat-progress-bar {
	flex: 1;
	height: 12rpx;
	background-color: #F0F0F0;
	border-radius: 6rpx;
	overflow: hidden;
}

.cat-progress-fill {
	height: 100%;
	border-radius: 6rpx;
	transition: width 0.3s;
}

.cat-percent {
	font-size: 24rpx;
	color: #666;
	min-width: 60rpx;
	text-align: right;
}

/* 弹窗 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.popup-content {
	width: 600rpx;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 40rpx;
}

.popup-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	text-align: center;
	margin-bottom: 30rpx;
}

.picker-field {
	padding: 20rpx;
	background-color: #FAFAFA;
	border-radius: 12rpx;
	margin-bottom: 20rpx;
}

.selected-cat {
	font-size: 28rpx;
	color: #333;
}

.placeholder {
	font-size: 28rpx;
	color: #999;
}

.popup-input {
	width: 100%;
	padding: 20rpx;
	background-color: #FAFAFA;
	border-radius: 12rpx;
	font-size: 28rpx;
	margin-bottom: 30rpx;
}

.popup-buttons {
	display: flex;
	gap: 20rpx;
}

.cancel-btn, .confirm-btn {
	flex: 1;
	height: 80rpx;
	font-size: 28rpx;
	border-radius: 12rpx;
	border: none;
}

.cancel-btn {
	background-color: #F5F5F5;
	color: #666;
}

.confirm-btn {
	background-color: #1890FF;
	color: #FFFFFF;
}
</style>
