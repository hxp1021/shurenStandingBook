Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 表单数据
    formData: {
      name: '',
      department: '',
      project: '',
      direction: '',
      deliveryTime: '', // 交付时间
      fee: '', // 费用
      paid: false, // 已付
      remark: '', // 备注
      files: [], // 上传的文件列表
      submitUserName: '', // 提交者用户名,
    },
    projectOptions: ['其他', '卫生厅', '中管局', '国青', '省自然', '面上'],
    projectIndex: 0,
    uploading: false, // 文件上传状态
    loading: false, // 提交加载状态
    today: '' // 今日日期（作为日期选择起始）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取今日日期，格式为 YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    this.setData({
      today: `${year}-${month}-${day}`
    });
  },

  // 输入框内容变化处理
  handleInput(e) {
    const { key } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${key}`]: value
    });
  },

  // 添加项目选择变化处理方法
  handleProjectChange(e) {
    const index = e.detail.value;
    this.setData({
      projectIndex: index,
      'formData.project': this.data.projectOptions[index]
    });
  },

  // 日期选择变化（交付时间）
  handleDateChange(e) {
    this.setData({
      'formData.deliveryTime': e.detail.value
    });
  },

  // 开关变化（已付）
  handleSwitchChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({
      [`formData.${key}`]: e.detail.value
    });
  },

  // 表单重置
  formReset(showToast = true) {
    // 重置表单数据到初始状态
    this.setData({
      formData: {
        name: '',
        department: '',
        project: '',
        direction: '',
        deliveryTime: '',
        fee: '',
        paid: false,
        remark: '',
      }
    });
    showToast && wx.showToast({
      title: '表单已重置',
      icon: 'success',
      duration: 1500
    });
  },

  // 表单提交
  // pages/form/form.js
  formSubmit(e) {
    // 1. 表单验证（原有逻辑保留）
    const { name, department, project, deliveryTime, fee } = this.data.formData;
    if (!name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!department) {
      wx.showToast({ title: '请输入科室', icon: 'none' });
      return;
    }
    if (!project) {
      wx.showToast({ title: '请输入项目', icon: 'none' });
      return;
    }
    if (!deliveryTime) {
      wx.showToast({ title: '请选择交付时间', icon: 'none' });
      return;
    }
    if (!fee || isNaN(Number(fee)) || Number(fee) <= 0) {
      wx.showToast({ title: '请输入有效的费用金额', icon: 'none' });
      return;
    }

    // 2. 提交数据（核心修改：添加openid）
    this.setData({ loading: true });

    const app = getApp();
    const openid = app.globalData.openid;

    // 获取云数据库引用
    const db = wx.cloud.database();
    // 整理提交的数据（新增openid字段）
    const submitData = {
      ...this.data.formData,
      fee: Number(fee),
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      openid: openid // 关键：绑定当前用户的openid
    };

    // 插入到数据库集合中
    db.collection('project_manage').add({
      data: submitData,
      success: (res) => {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        this.formReset(false);
      },
      fail: (err) => {
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
        console.error('表单提交失败：', err);
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 选择文件
  chooseFile() {
    if (this.data.uploading) {
      wx.showToast({ title: '正在上传中，请稍候', icon: 'none' });
      return;
    }

    wx.chooseMessageFile({
      count: 5,
      type: 'all',
      success: (res) => {
        const files = res.tempFiles;
        this.setData({ uploading: true });

        // 逐个上传文件
        files.forEach(file => {
          this.uploadFile(file);
        });
      },
      fail: (err) => {
        console.error('选择文件失败:', err);
      }
    });
  },

  // 上传文件
  uploadFile(file) {
    const cloudPath = `files/${Date.now()}-${Math.floor(Math.random() * 10000)}${file.path.match(/\.[^.]+?$/)[0]}`;

    wx.cloud.uploadFile({
      cloudPath,
      filePath: file.path,
      success: (res) => {
        const { formData } = this.data;
        const newFiles = [...formData.files, {
          name: file.name,
          size: file.size,
          displaySize: (file.size / 1024).toFixed(2) + 'KB',
          type: file.type,
          url: res.fileID
        }];

        this.setData({
          'formData.files': newFiles
        });
      },
      fail: (err) => {
        wx.showToast({ title: '上传失败', icon: 'none' });
        console.error('上传文件失败:', err);
      },
      complete: () => {
        this.setData({ uploading: false });
      }
    });
  },

  // 删除文件
  removeFile(e) {
    const { index } = e.currentTarget.dataset;
    const { formData } = this.data;
    const newFiles = [...formData.files];
    newFiles.splice(index, 1);

    this.setData({
      'formData.files': newFiles
    });
  }
});