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

		<!-- 月度概览 -->
		<view class="overview-card">
			<view class="overview-item">
				<text class="overview-label">收入</text>
				<text class="overview-value income">+{{formatAmount(monthIncome)}}</text>
			</view>
			<view class="overview-item">
				<text class="overview-label">支出</text>
				<text class="overview-value expense">-{{formatAmount(monthExpense)}}</text>
			</view>
			<view class="overview-item">
				<text class="overview-label">结余</text>
				<text class="overview-value" :class="monthBalance >= 0 ? 'income' : 'expense'">
					{{formatAmount(monthBalance)}}
				</text>
			</view>
		</view>

		<!-- 分类统计 -->
		<view class="stats-card">
			<view class="card-header">
				<text class="card-title">支出分类</text>
			</view>

			<view v-if="categoryStats.length === 0" class="empty-stats">
				<text class="empty-icon">📊</text>
				<text class="empty-text">本月暂无支出数据</text>
			</view>

			<view v-else>
				<!-- 饼图区域 -->
				<view class="chart-container">
					<canvas canvas-id="pieChart" class="pie-chart"></canvas>
					<view class="chart-center">
						<text class="center-label">总支出</text>
						<text class="center-value">{{formatAmount(monthExpense)}}</text>
					</view>
				</view>

				<!-- 分类列表 -->
				<view class="category-list">
					<view
						v-for="(stat, index) in categoryStats"
						:key="stat.categoryId"
						class="category-stat-item"
					>
						<view class="stat-left">
							<view class="color-dot" :style="{ backgroundColor: getCategoryColor(stat.categoryId) }"></view>
							<text class="stat-category">{{stat.categoryName}}</text>
						</view>
						<view class="stat-right">
							<text class="stat-amount">{{formatAmount(stat.amount)}}</text>
							<text class="stat-percent">{{calculatePercent(stat.amount)}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 趋势分析 -->
		<view class="trend-card">
			<view class="card-header">
				<text class="card-title">近7天趋势</text>
			</view>

			<view v-if="dailyTrend.length === 0" class="empty-stats">
				<text class="empty-icon">📈</text>
				<text class="empty-text">暂无趋势数据</text>
			</view>

			<view v-else class="trend-chart">
				<view
					v-for="(item, index) in dailyTrend"
					:key="index"
					class="trend-bar-group"
				>
					<view class="bar-container">
						<view
							class="trend-bar income-bar"
							:style="{ height: getBarHeight(item.income, 'income') + 'rpx' }"
						></view>
						<view
							class="trend-bar expense-bar"
							:style="{ height: getBarHeight(item.expense, 'expense') + 'rpx' }"
						></view>
					</view>
					<text class="bar-date">{{formatBarDate(item.date)}}</text>
				</view>
			</view>

			<view v-if="dailyTrend.length > 0" class="trend-legend">
				<view class="legend-item">
					<view class="legend-dot income"></view>
					<text class="legend-text">收入</text>
				</view>
				<view class="legend-item">
					<view class="legend-dot expense"></view>
					<text class="legend-text">支出</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { formatAmount, formatDate, getCategoryById } from '@/utils/constants.js'
import { getCurrentMonthIncome, getCurrentMonthExpense, getCategoryStats, getDailyTrend } from '@/utils/storage.js'

export default {
	data() {
		return {
			selectedMonth: this.getCurrentMonthStr(),
			monthIncome: 0,
			monthExpense: 0,
			categoryStats: [],
			dailyTrend: []
		}
	},

	computed: {
		monthBalance() {
			return this.monthIncome - this.monthExpense
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
			this.monthIncome = getCurrentMonthIncome()
			this.monthExpense = getCurrentMonthExpense()
			this.categoryStats = getCategoryStats(this.selectedMonth)
			this.dailyTrend = getDailyTrend(7)

			// 绘制饼图
			if (this.categoryStats.length > 0) {
				setTimeout(() => {
					this.drawPieChart()
				}, 100)
			}
		},

		calculatePercent(amount) {
			if (this.monthExpense === 0) return '0%'
			return Math.round((amount / this.monthExpense) * 100) + '%'
		},

		getCategoryColor(categoryId) {
			const cat = getCategoryById(categoryId)
			return cat.color
		},

		drawPieChart() {
			const ctx = uni.createCanvasContext('pieChart', this)
			const width = 400
			const height = 400
			const centerX = width / 2
			const centerY = height / 2
			const radius = 150

			let startAngle = 0
			const total = this.monthExpense

			this.categoryStats.forEach((stat) => {
				const angle = (stat.amount / total) * 2 * Math.PI
				const color = this.getCategoryColor(stat.categoryId)

				ctx.beginPath()
				ctx.moveTo(centerX, centerY)
				ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle)
				ctx.closePath()
				ctx.setFillStyle(color)
				ctx.fill()

				startAngle += angle
			})

			// 绘制中心白色圆形
			ctx.beginPath()
			ctx.arc(centerX, centerY, 80, 0, 2 * Math.PI)
			ctx.setFillStyle('#FFFFFF')
			ctx.fill()

			ctx.draw()
		},

		getBarHeight(value, type) {
			const maxValue = Math.max(
				...this.dailyTrend.map(item => Math.max(item.income, item.expense))
			)
			if (maxValue === 0) return 0
			const maxHeight = 200
			return (value / maxValue) * maxHeight
		},

		formatBarDate(dateStr) {
			const parts = dateStr.split('-')
			return parts[2]
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

/* 月度概览 */
.overview-card {
	display: flex;
	justify-content: space-around;
	background-color: #FFFFFF;
	margin: 0 20rpx 20rpx;
	padding: 40rpx 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.overview-item {
	text-align: center;
}

.overview-label {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-bottom: 12rpx;
}

.overview-value {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
}

.overview-value.income {
	color: #52C41A;
}

.overview-value.expense {
	color: #FF4D4F;
}

/* 统计卡片 */
.stats-card, .trend-card {
	background-color: #FFFFFF;
	margin: 0 20rpx 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-header {
	margin-bottom: 30rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.empty-stats {
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

/* 饼图 */
.chart-container {
	position: relative;
	width: 400rpx;
	height: 400rpx;
	margin: 0 auto 40rpx;
}

.pie-chart {
	width: 400rpx;
	height: 400rpx;
}

.chart-center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
}

.center-label {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
}

.center-value {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

/* 分类列表 */
.category-list {
	margin-top: 30rpx;
}

.category-stat-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #F0F0F0;
}

.category-stat-item:last-child {
	border-bottom: none;
}

.stat-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.color-dot {
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	margin-right: 16rpx;
}

.stat-category {
	font-size: 28rpx;
	color: #333;
}

.stat-right {
	text-align: right;
}

.stat-amount {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 4rpx;
}

.stat-percent {
	display: block;
	font-size: 24rpx;
	color: #999;
}

/* 趋势图表 */
.trend-chart {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	height: 260rpx;
	padding: 20rpx 0;
}

.trend-bar-group {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.bar-container {
	display: flex;
	align-items: flex-end;
	gap: 4rpx;
	height: 200rpx;
}

.trend-bar {
	width: 24rpx;
	border-radius: 4rpx 4rpx 0 0;
	transition: height 0.3s;
}

.income-bar {
	background: linear-gradient(to top, #52C41A, #73D13D);
}

.expense-bar {
	background: linear-gradient(to top, #FF4D4F, #FF7875);
}

.bar-date {
	font-size: 22rpx;
	color: #999;
	margin-top: 12rpx;
}

.trend-legend {
	display: flex;
	justify-content: center;
	gap: 40rpx;
	margin-top: 20rpx;
}

.legend-item {
	display: flex;
	align-items: center;
}

.legend-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	margin-right: 8rpx;
}

.legend-dot.income {
	background-color: #52C41A;
}

.legend-dot.expense {
	background-color: #FF4D4F;
}

.legend-text {
	font-size: 24rpx;
	color: #666;
}
</style>
