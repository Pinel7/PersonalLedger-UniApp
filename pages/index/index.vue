<template>
	<view class="page">
		<!-- 本月概览 -->
		<view class="summary-card">
			<view class="summary-item">
				<text class="summary-label">本月收入</text>
				<text class="summary-value income">+{{formatAmount(monthIncome)}}</text>
			</view>
			<view class="summary-divider"></view>
			<view class="summary-item">
				<text class="summary-label">本月支出</text>
				<text class="summary-value expense">-{{formatAmount(monthExpense)}}</text>
			</view>
			<view class="summary-divider"></view>
			<view class="summary-item">
				<text class="summary-label">结余</text>
				<text class="summary-value" :class="monthBalance >= 0 ? 'income' : 'expense'">{{formatAmount(monthBalance)}}</text>
			</view>
		</view>

		<!-- 记账表单 -->
		<view class="form-card">
			<!-- 类型切换 -->
			<view class="type-switch">
				<view
					class="switch-btn"
					:class="{ active: recordType === 'expense' }"
					@click="recordType = 'expense'"
				>
					支出
				</view>
				<view
					class="switch-btn"
					:class="{ active: recordType === 'income' }"
					@click="recordType = 'income'"
				>
					收入
				</view>
			</view>

			<!-- 金额输入 -->
			<view class="amount-input-wrapper">
				<text class="currency-symbol">¥</text>
				<input
					type="digit"
					v-model="amount"
					placeholder="0.00"
					class="amount-input"
					@input="onAmountInput"
				/>
			</view>

			<!-- 分类选择 -->
			<view class="category-section">
				<text class="section-label">分类</text>
				<view class="category-grid">
					<view
						v-for="cat in currentCategories"
						:key="cat.id"
						class="category-item"
						:class="{ selected: selectedCategory === cat.id }"
						@click="selectCategory(cat)"
					>
						<text class="category-icon">{{cat.icon}}</text>
						<text class="category-name">{{cat.name}}</text>
					</view>
				</view>
			</view>

			<!-- 备注输入 -->
			<view class="note-section">
				<input
					v-model="note"
					placeholder="添加备注（可选）"
					class="note-input"
				/>
			</view>

			<!-- 时间选择 -->
			<view class="time-section">
				<picker mode="date" :value="selectedDate" @change="onDateChange">
					<view class="time-picker">
						<text class="time-label">📅 {{selectedDate}}</text>
					</view>
				</picker>
			</view>

			<!-- 提交按钮 -->
			<button class="submit-btn" @click="submitRecord" :disabled="!canSubmit">
				确认记账
			</button>
		</view>

		<!-- 最近记录 -->
		<view class="records-section">
			<view class="section-header">
				<text class="section-title">最近记录</text>
				<text v-if="recentRecords.length > 0" class="clear-btn" @click="confirmClear">清空</text>
			</view>

			<view v-if="recentRecords.length === 0" class="empty-state">
				<text class="empty-icon">📝</text>
				<text class="empty-text">暂无记录，开始记第一笔账吧</text>
			</view>

			<view v-else class="records-list">
				<view
					v-for="record in recentRecords"
					:key="record.id"
					class="record-item"
					@click="viewDetail(record.id)"
				>
					<view class="record-left">
						<text class="record-category-icon">{{getCategoryIcon(record.categoryId)}}</text>
						<view class="record-info">
							<text class="record-category">{{record.category}}</text>
							<text v-if="record.note" class="record-note">{{record.note}}</text>
							<text class="record-time">{{formatRecordTime(record.timestamp)}}</text>
						</view>
					</view>
					<text class="record-amount" :class="record.type">
						{{record.type === 'income' ? '+' : '-'}}{{formatAmount(record.amount)}}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryById, formatAmount, formatDate } from '@/utils/constants.js'
import { getRecords, addRecord, getCurrentMonthIncome, getCurrentMonthExpense } from '@/utils/storage.js'

export default {
	data() {
		return {
			recordType: 'expense', // 'income' | 'expense'
			amount: '',
			selectedCategory: '',
			note: '',
			selectedDate: formatDate(Date.now()),
			recentRecords: [],
			monthIncome: 0,
			monthExpense: 0
		}
	},

	computed: {
		currentCategories() {
			return this.recordType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
		},
		canSubmit() {
			return this.amount && parseFloat(this.amount) > 0 && this.selectedCategory
		},
		monthBalance() {
			return this.monthIncome - this.monthExpense
		}
	},

	onShow() {
		this.loadData()
	},

	methods: {
		formatAmount,

		onAmountInput(e) {
			let value = e.detail.value
			// 只允许数字和小数点
			value = value.replace(/[^\d.]/g, '')
			// 只保留一个小数点
			const parts = value.split('.')
			if (parts.length > 2) {
				value = parts[0] + '.' + parts.slice(1).join('')
			}
			// 限制小数位数
			if (parts[1] && parts[1].length > 2) {
				value = parts[0] + '.' + parts[1].substring(0, 2)
			}
			this.amount = value
		},

		selectCategory(cat) {
			this.selectedCategory = cat.id
		},

		onDateChange(e) {
			this.selectedDate = e.detail.value
		},

		submitRecord() {
			if (!this.canSubmit) return

			const category = getCategoryById(this.selectedCategory)
			const dateParts = this.selectedDate.split('-')
			const timestamp = new Date(
				parseInt(dateParts[0]),
				parseInt(dateParts[1]) - 1,
				parseInt(dateParts[2]),
				new Date().getHours(),
				new Date().getMinutes()
			).getTime()

			const record = {
				type: this.recordType,
				amount: parseFloat(this.amount),
				category: category.name,
				categoryId: this.selectedCategory,
				note: this.note,
				time: this.selectedDate,
				timestamp: timestamp
			}

			addRecord(record)

			// 重置表单
			this.amount = ''
			this.selectedCategory = ''
			this.note = ''

			uni.showToast({ title: '记账成功', icon: 'success' })
			this.loadData()
		},

		loadData() {
			const records = getRecords()
			this.recentRecords = records.slice(0, 10)
			this.monthIncome = getCurrentMonthIncome()
			this.monthExpense = getCurrentMonthExpense()
		},

		getCategoryIcon(categoryId) {
			const cat = getCategoryById(categoryId)
			return cat.icon
		},

		formatRecordTime(timestamp) {
			const now = new Date()
			const recordDate = new Date(timestamp)
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
			const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())

			const diffDays = Math.floor((today - recordDay) / (24 * 60 * 60 * 1000))

			if (diffDays === 0) {
				return '今天 ' + this.formatTime(timestamp)
			} else if (diffDays === 1) {
				return '昨天 ' + this.formatTime(timestamp)
			} else if (diffDays < 7) {
				return diffDays + '天前'
			} else {
				return formatDate(timestamp)
			}
		},

		formatTime(timestamp) {
			const date = new Date(timestamp)
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			return `${hours}:${minutes}`
		},

		viewDetail(recordId) {
			uni.navigateTo({
				url: `/pages/detail/detail?id=${recordId}`
			})
		},

		confirmClear() {
			uni.showModal({
				title: '提示',
				content: '确定要清空所有记录吗？此操作不可恢复',
				success: (res) => {
					if (res.confirm) {
						uni.setStorageSync('ledgerRecords', [])
						this.loadData()
						uni.showToast({ title: '已清空', icon: 'success' })
					}
				}
			})
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

/* 本月概览 */
.summary-card {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	margin: 20rpx;
	padding: 40rpx 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.summary-item {
	flex: 1;
	text-align: center;
}

.summary-label {
	display: block;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	margin-bottom: 12rpx;
}

.summary-value {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.summary-value.income {
	color: #52C41A;
}

.summary-value.expense {
	color: #FF6B6B;
}

.summary-divider {
	width: 2rpx;
	height: 60rpx;
	background-color: rgba(255, 255, 255, 0.3);
}

/* 记账表单 */
.form-card {
	background-color: #FFFFFF;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.type-switch {
	display: flex;
	background-color: #F5F5F5;
	border-radius: 12rpx;
	padding: 6rpx;
	margin-bottom: 30rpx;
}

.switch-btn {
	flex: 1;
	text-align: center;
	padding: 16rpx 0;
	font-size: 28rpx;
	color: #666;
	border-radius: 8rpx;
	transition: all 0.3s;
}

.switch-btn.active {
	background-color: #FFFFFF;
	color: #1890FF;
	font-weight: bold;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.amount-input-wrapper {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx 0;
	border-bottom: 2rpx solid #F0F0F0;
	margin-bottom: 30rpx;
}

.currency-symbol {
	font-size: 48rpx;
	color: #333;
	margin-right: 10rpx;
}

.amount-input {
	font-size: 64rpx;
	font-weight: bold;
	color: #333;
	text-align: center;
	min-width: 300rpx;
}

.category-section {
	margin-bottom: 30rpx;
}

.section-label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.category-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 20rpx;
}

.category-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx 10rpx;
	border-radius: 12rpx;
	background-color: #FAFAFA;
	border: 2rpx solid transparent;
	transition: all 0.2s;
}

.category-item.selected {
	background-color: #E6F7FF;
	border-color: #1890FF;
}

.category-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.category-name {
	font-size: 22rpx;
	color: #666;
}

.note-section {
	margin-bottom: 20rpx;
}

.note-input {
	width: 100%;
	padding: 20rpx;
	background-color: #FAFAFA;
	border-radius: 12rpx;
	font-size: 28rpx;
}

.time-section {
	margin-bottom: 30rpx;
}

.time-picker {
	padding: 20rpx;
	background-color: #FAFAFA;
	border-radius: 12rpx;
}

.time-label {
	font-size: 28rpx;
	color: #666;
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #FFFFFF;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 12rpx;
	border: none;
	box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.3);
}

.submit-btn[disabled] {
	opacity: 0.5;
}

/* 最近记录 */
.records-section {
	background-color: #FFFFFF;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.clear-btn {
	font-size: 26rpx;
	color: #FF4D4F;
}

.empty-state {
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

.records-list {
	max-height: 600rpx;
}

.record-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #F0F0F0;
}

.record-item:last-child {
	border-bottom: none;
}

.record-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.record-category-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.record-info {
	flex: 1;
}

.record-category {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 6rpx;
}

.record-note {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-bottom: 4rpx;
}

.record-time {
	display: block;
	font-size: 22rpx;
	color: #CCC;
}

.record-amount {
	font-size: 32rpx;
	font-weight: bold;
}

.record-amount.income {
	color: #52C41A;
}

.record-amount.expense {
	color: #FF4D4F;
}
</style>
