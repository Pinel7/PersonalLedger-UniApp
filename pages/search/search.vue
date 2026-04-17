<template>
	<view class="page">
		<!-- 搜索框 -->
		<view class="search-bar">
			<input
				v-model="searchKeyword"
				placeholder="搜索备注或分类..."
				class="search-input"
				@confirm="handleSearch"
			/>
			<button class="search-btn" @click="handleSearch">搜索</button>
		</view>

		<!-- 筛选条件 -->
		<view class="filter-section">
			<view class="filter-row">
				<text class="filter-label">类型</text>
				<view class="filter-options">
					<view
						class="filter-option"
						:class="{ active: filterType === '' }"
						@click="filterType = ''"
					>
						全部
					</view>
					<view
						class="filter-option"
						:class="{ active: filterType === 'income' }"
						@click="filterType = 'income'"
					>
						收入
					</view>
					<view
						class="filter-option"
						:class="{ active: filterType === 'expense' }"
						@click="filterType = 'expense'"
					>
						支出
					</view>
				</view>
			</view>

			<view class="filter-row">
				<text class="filter-label">分类</text>
				<picker :range="allCategories" range-key="name" @change="onCategoryFilterChange">
					<view class="picker-field">
						<text v-if="filterCategoryId" class="selected-text">
							{{getCategoryIcon(filterCategoryId)}} {{getCategoryName(filterCategoryId)}}
						</text>
						<text v-else class="placeholder">全部分类</text>
					</view>
				</picker>
			</view>

			<view class="filter-row">
				<text class="filter-label">日期范围</text>
				<view class="date-range">
					<picker mode="date" :value="startDate" @change="onStartDateChange">
						<view class="date-picker">{{startDate || '开始日期'}}</view>
					</picker>
					<text class="date-separator">至</text>
					<picker mode="date" :value="endDate" @change="onEndDateChange">
						<view class="date-picker">{{endDate || '结束日期'}}</view>
					</picker>
				</view>
			</view>

			<view class="filter-row">
				<text class="filter-label">金额范围</text>
				<view class="amount-range">
					<input
						type="digit"
						v-model="minAmount"
						placeholder="最小金额"
						class="amount-input"
					/>
					<text class="amount-separator">-</text>
					<input
						type="digit"
						v-model="maxAmount"
						placeholder="最大金额"
						class="amount-input"
					/>
				</view>
			</view>

			<view class="filter-actions">
				<button class="reset-btn" @click="resetFilters">重置</button>
				<button class="apply-btn" @click="handleSearch">应用筛选</button>
			</view>
		</view>

		<!-- 搜索结果 -->
		<view class="results-section">
			<view class="results-header">
				<text class="results-count">共 {{filteredRecords.length}} 条记录</text>
			</view>

			<view v-if="filteredRecords.length === 0" class="empty-results">
				<text class="empty-icon">🔍</text>
				<text class="empty-text">{{hasSearched ? '未找到匹配的记录' : '输入关键词或设置筛选条件'}}</text>
			</view>

			<view v-else class="results-list">
				<view
					v-for="record in filteredRecords"
					:key="record.id"
					class="result-item"
					@click="viewDetail(record.id)"
				>
					<view class="result-left">
						<text class="result-category-icon">{{getCategoryIcon(record.categoryId)}}</text>
						<view class="result-info">
							<text class="result-category">{{record.category}}</text>
							<text v-if="record.note" class="result-note">{{record.note}}</text>
							<text class="result-time">{{formatRecordTime(record.timestamp)}}</text>
						</view>
					</view>
					<text class="result-amount" :class="record.type">
						{{record.type === 'income' ? '+' : '-'}}{{formatAmount(record.amount)}}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { formatAmount, formatDate, getCategoryById, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/constants.js'
import { searchRecords } from '@/utils/storage.js'

export default {
	data() {
		return {
			searchKeyword: '',
			filterType: '',
			filterCategoryId: '',
			startDate: '',
			endDate: '',
			minAmount: '',
			maxAmount: '',
			filteredRecords: [],
			hasSearched: false
		}
	},

	computed: {
		allCategories() {
			return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
		}
	},

	onShow() {
		this.handleSearch()
	},

	methods: {
		formatAmount,
		formatDate,

		handleSearch() {
			const options = {
				keyword: this.searchKeyword.trim(),
				type: this.filterType || undefined,
				categoryId: this.filterCategoryId || undefined,
				startDate: this.startDate ? new Date(this.startDate).getTime() : undefined,
				endDate: this.endDate ? new Date(this.endDate + ' 23:59:59').getTime() : undefined,
				minAmount: this.minAmount ? parseFloat(this.minAmount) : undefined,
				maxAmount: this.maxAmount ? parseFloat(this.maxAmount) : undefined
			}

			this.filteredRecords = searchRecords(options)
			this.hasSearched = true
		},

		resetFilters() {
			this.searchKeyword = ''
			this.filterType = ''
			this.filterCategoryId = ''
			this.startDate = ''
			this.endDate = ''
			this.minAmount = ''
			this.maxAmount = ''
			this.filteredRecords = []
			this.hasSearched = false
		},

		onCategoryFilterChange(e) {
			const index = e.detail.value
			this.filterCategoryId = this.allCategories[index].id
		},

		onStartDateChange(e) {
			this.startDate = e.detail.value
		},

		onEndDateChange(e) {
			this.endDate = e.detail.value
		},

		getCategoryIcon(categoryId) {
			return getCategoryById(categoryId).icon
		},

		getCategoryName(categoryId) {
			return getCategoryById(categoryId).name
		},

		formatRecordTime(timestamp) {
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			return `${year}-${month}-${day} ${hours}:${minutes}`
		},

		viewDetail(recordId) {
			uni.navigateTo({
				url: `/pages/detail/detail?id=${recordId}`
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

/* 搜索栏 */
.search-bar {
	display: flex;
	padding: 20rpx;
	background-color: #FFFFFF;
	gap: 16rpx;
}

.search-input {
	flex: 1;
	padding: 20rpx 24rpx;
	background-color: #F5F5F5;
	border-radius: 12rpx;
	font-size: 28rpx;
}

.search-btn {
	padding: 0 40rpx;
	height: 80rpx;
	background-color: #1890FF;
	color: #FFFFFF;
	font-size: 28rpx;
	border-radius: 12rpx;
	border: none;
}

/* 筛选区域 */
.filter-section {
	background-color: #FFFFFF;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.filter-row {
	margin-bottom: 30rpx;
}

.filter-row:last-of-type {
	margin-bottom: 0;
}

.filter-label {
	display: block;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 16rpx;
}

.filter-options {
	display: flex;
	gap: 16rpx;
}

.filter-option {
	padding: 12rpx 24rpx;
	background-color: #F5F5F5;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #666;
	transition: all 0.2s;
}

.filter-option.active {
	background-color: #E6F7FF;
	color: #1890FF;
	font-weight: bold;
}

.picker-field {
	padding: 16rpx 20rpx;
	background-color: #F5F5F5;
	border-radius: 8rpx;
}

.selected-text {
	font-size: 26rpx;
	color: #333;
}

.placeholder {
	font-size: 26rpx;
	color: #999;
}

.date-range {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.date-picker {
	flex: 1;
	padding: 16rpx 20rpx;
	background-color: #F5F5F5;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #333;
	text-align: center;
}

.date-separator {
	font-size: 26rpx;
	color: #999;
}

.amount-range {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.amount-input {
	flex: 1;
	padding: 16rpx 20rpx;
	background-color: #F5F5F5;
	border-radius: 8rpx;
	font-size: 26rpx;
}

.amount-separator {
	font-size: 26rpx;
	color: #999;
}

.filter-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 30rpx;
	padding-top: 30rpx;
	border-top: 1rpx solid #F0F0F0;
}

.reset-btn, .apply-btn {
	flex: 1;
	height: 80rpx;
	font-size: 28rpx;
	border-radius: 12rpx;
	border: none;
}

.reset-btn {
	background-color: #F5F5F5;
	color: #666;
}

.apply-btn {
	background-color: #1890FF;
	color: #FFFFFF;
}

/* 搜索结果 */
.results-section {
	background-color: #FFFFFF;
	margin: 0 20rpx 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.results-header {
	margin-bottom: 20rpx;
}

.results-count {
	font-size: 26rpx;
	color: #999;
}

.empty-results {
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

.results-list {
	max-height: 800rpx;
}

.result-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #F0F0F0;
}

.result-item:last-child {
	border-bottom: none;
}

.result-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.result-category-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.result-info {
	flex: 1;
}

.result-category {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 6rpx;
}

.result-note {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-bottom: 4rpx;
}

.result-time {
	display: block;
	font-size: 22rpx;
	color: #CCC;
}

.result-amount {
	font-size: 32rpx;
	font-weight: bold;
}

.result-amount.income {
	color: #52C41A;
}

.result-amount.expense {
	color: #FF4D4F;
}
</style>
