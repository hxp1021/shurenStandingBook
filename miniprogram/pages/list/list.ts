Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 列表数据
    listData: [],
    // 筛选相关
    deliveryFilterOptions: ['全部', '未交付', '已交付', '部分交付'],
    currentFilter: 0, // 默认选中全部
    searchKeyword: '', // 搜索关键词
    // 加载相关
    loading: false, // 加载状态
    refreshing: false, // 下拉刷新状态
    hasMore: true, // 是否有更多数据
    pageSize: 10, // 每页加载数量
    pageNum: 1, // 当前页码
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时获取数据
    this.loadData();
  },

  /**
   * 加载数据（核心函数）
   */
  // pages/list/list.js
  loadData(isLoadMore = false) {
    if (this.data.loading && !isLoadMore) return;

    this.setData({
      loading: true
    });

    const app = getApp();
    const openid = app.globalData.openid;

    // 获取云数据库引用
    const db = wx.cloud.database();
    // 构建查询条件（核心：添加openid筛选）
    let query = db.collection('project_manage').where({
      openid: openid // 只查询当前用户提交的数据
    });

    // 1. 筛选交付状态（原有逻辑保留）
    if (this.data.currentFilter !== 0) {
      const filterStatus = this.data.deliveryFilterOptions[this.data.currentFilter];
      query = query.where({
        deliveryStatus: filterStatus
      });
    }
 
    // 2. 搜索关键词（原有逻辑保留）
    if (this.data.searchKeyword) {
      query = query.where(db.command.and([
        { openid: openid }, // 必须保留openid筛选
        db.command.or([
          { name: db.RegExp({ regexp: this.data.searchKeyword, options: 'i' }) },
          { project: db.RegExp({ regexp: this.data.searchKeyword, options: 'i' }) }
        ])
      ]));
    }

    // 3. 分页 + 排序（原有逻辑保留）
    query = query
      .orderBy('createTime', 'desc')
      .skip((this.data.pageNum - 1) * this.data.pageSize)
      .limit(this.data.pageSize);

    // 执行查询
    query.get({
      success: (res) => {
        const newData = isLoadMore ? [...this.data.listData, ...res.data] : res.data;
        const hasMore = res.data.length === this.data.pageSize;

        this.setData({
          listData: newData,
          hasMore,
          loading: false,
          refreshing: false
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
        console.error('加载数据失败：', err);
        this.setData({
          loading: false,
          refreshing: false
        });
      }
    });
  },

  /**
   * 筛选条件变化
   */
  handleFilterChange(e) {
    this.setData({
      currentFilter: e.detail.value,
      pageNum: 1, // 重置页码
      hasMore: true // 重置更多数据状态
    }, () => {
      this.loadData(); // 重新加载数据
    });
  },

  /**
   * 搜索输入
   */
  handleSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 执行搜索
   */
  handleSearch() {
    this.setData({
      pageNum: 1,
      hasMore: true
    }, () => {
      this.loadData();
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      refreshing: true,
      pageNum: 1,
      hasMore: true
    }, () => {
      this.loadData();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({
      pageNum: this.data.pageNum + 1
    }, () => {
      this.loadData(true); // 加载更多
    });
  },

  /**
   * 页面刷新（返回页面时重新加载）
   */
  onShow() {
    if (this.data.listData.length > 0) {
      this.setData({
        pageNum: 1,
        hasMore: true
      }, () => {
        this.loadData();
      });
    }
  }
});