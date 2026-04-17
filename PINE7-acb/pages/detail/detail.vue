<template>
	<view class="page">
		<view v-if="record" class="detail-card">
			<!-- 类型和金额 -->
			<view class="amount-section" :class="record.type">
				<text class="type-badge">{{record.type === 'income' ? '收入' : '支出'}}</text>
				<text class="amount-display">
					{{record.type === 'income' ? '+' : '-'}}¥{{formatAmount(record.amount)}}
				</text>
			</view>

			<!-- 详细信息 -->
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">分类</text>
					<view class="info-value">
						<text class="category-icon">{{getCategoryIcon(record.categoryId)}}</text>
						<text class="category-name">{{record.category}}</text>
					</view>
				</view>

				<view class="info-item">
					<text class="info-label">时间</text>
					<picker mode="date" :value="editDate" @change="onDateChange">
						<view class="info-value clickable">
							<text>{{formatFullTime(editTimestamp)}}</text>
							<text class="edit-hint">✏️</text>
						</view>
					</picker>
				</view>

				<view class="info-item">
					<text class="info-label">备注</text>
					<input
						v-model="editNote"
						placeholder="添加备注..."
						class="note-input"
					/>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-buttons">
				<button class="delete-btn" @click="confirmDelete">
					🗑️ 删除记录
				</button>
				<button class="save-btn" @click="saveChanges">
					💾 保存修改
				</button>
			</view>
		</view>

		<view v-else class="empty-state">
			<text class="empty-icon">❌</text>
			<text class="empty-text">记录不存在</text>
		</view>
	</view>
</template>

<script>
import { formatAmount, getCategoryById, formatDate } from '@/utils/constants.js'
import { getRecordById, updateRecord, deleteRecord } from '@/utils/storage.js'

export default {
	data() {
		return {
			recordId: '',
			record: null,
			editNote: '',
			editDate: '',
			editTimestamp: 0
		}
	},

	onLoad(options) {
		if (options.id) {
			this.recordId = options.id
			this.loadRecord()
		}
	},

	methods: {
		formatAmount,
		formatDate,

		loadRecord() {
			const record = getRecordById(this.recordId)
			if (record) {
				this.record = record
				this.editNote = record.note || ''
				this.editDate = formatDate(record.timestamp)
				this.editTimestamp = record.timestamp
			}
		},

		getCategoryIcon(categoryId) {
			return getCategoryById(categoryId).icon
		},

		formatFullTime(timestamp) {
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			return `${year}-${month}-${day} ${hours}:${minutes}`
		},

		onDateChange(e) {
			this.editDate = e.detail.value
			// 保持原有的时分秒
			const oldDate = new Date(this.editTimestamp)
			const newDate = new Date(this.editDate)
			newDate.setHours(oldDate.getHours())
			newDate.setMinutes(oldDate.getMinutes())
			newDate.setSeconds(oldDate.getSeconds())
			this.editTimestamp = newDate.getTime()
		},

		saveChanges() {
			if (!this.record) return

			const updates = {
				note: this.editNote,
				timestamp: this.editTimestamp,
				time: this.editDate
			}

			const success = updateRecord(this.recordId, updates)
			if (success) {
				uni.showToast({ title: '保存成功', icon: 'success' })
				this.loadRecord()
			} else {
				uni.showToast({ title: '保存失败', icon: 'none' })
			}
		},

		confirmDelete() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条记录吗？此操作不可恢复',
				success: (res) => {
					if (res.confirm) {
						this.deleteRecord()
					}
				}
			})
		},

		deleteRecord() {
			const success = deleteRecord(this.recordId)
			if (success) {
				uni.showToast({ title: '已删除', icon: 'success' })
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} else {
				uni.showToast({ title: '删除失败', icon: 'none' })
			}
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-color: #F5F5F5;
	padding: 20rpx;
}

.detail-card {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	overflow: hidden;
}

/* 金额区域 */
.amount-section {
	padding: 60rpx 40rpx;
	text-align: center;
}

.amount-section.income {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.amount-section.expense {
	background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
}

.type-badge {
	display: inline-block;
	padding: 8rpx 24rpx;
	background-color: rgba(255, 255, 255, 0.3);
	color: #FFFFFF;
	font-size: 24rpx;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
}

.amount-display {
	display: block;
	font-size: 72rpx;
	font-weight: bold;
	color: #FFFFFF;
}

/* 信息列表 */
.info-list {
	padding: 40rpx 30rpx;
}

.info-item {
	margin-bottom: 40rpx;
}

.info-item:last-child {
	margin-bottom: 0;
}

.info-label {
	display: block;
	font-size: 26rpx;
	color: #999;
	margin-bottom: 16rpx;
}

.info-value {
	display: flex;
	align-items: center;
	font-size: 28rpx;
	color: #333;
}

.info-value.clickable {
	padding: 20rpx;
	background-color: #FAFAFA;
	border-radius: 12rpx;
}

.edit-hint {
	margin-left: auto;
	font-size: 24rpx;
}

.category-icon {
	font-size: 40rpx;
	margin-right: 12rpx;
}

.category-name {
	font-size: 28rpx;
	color: #333;
}

.note-input {
	width: 100%;
	padding: 20rpx;
	background-color: #FAFAFA;
	border-radius: 12rpx;
	font-size: 28rpx;
}

/* 操作按钮 */
.action-buttons {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	border-top: 1rpx solid #F0F0F0;
}

.delete-btn, .save-btn {
	flex: 1;
	height: 88rpx;
	font-size: 28rpx;
	border-radius: 12rpx;
	border: none;
}

.delete-btn {
	background-color: #FFF1F0;
	color: #FF4D4F;
}

.save-btn {
	background-color: #1890FF;
	color: #FFFFFF;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 200rpx 0;
}

.empty-icon {
	display: block;
	font-size: 100rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>
