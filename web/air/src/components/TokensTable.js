import React, { useEffect, useState } from 'react';
import { API, copy, showError, showSuccess, timestamp2string } from '../helpers';

import { ITEMS_PER_PAGE } from '../constants';
import { renderQuota } from '../helpers/render';
import { Button, Dropdown, Form, Modal, Popconfirm, Popover, SplitButtonGroup, Table, Tag } from '@douyinfe/semi-ui';

import { IconTreeTriangleDown } from '@douyinfe/semi-icons';
import EditToken from '../pages/Token/EditToken';

const COPY_OPTIONS = [
  { key: 'next', text: 'ChatGPT Next Web', value: 'next' },
  { key: 'ama', text: 'ChatGPT Web & Midjourney', value: 'ama' },
  { key: 'opencat', text: 'OpenCat', value: 'opencat' },
  { key: 'lobechat', text: 'LobeChat', value: 'lobechat' },
];

const OPEN_LINK_OPTIONS = [
  { key: 'ama', text: 'ChatGPT Web & Midjourney', value: 'ama' },
  { key: 'opencat', text: 'OpenCat', value: 'opencat' },
  { key: 'lobechat', text: 'LobeChat', value: 'lobechat' }
];

function renderTimestamp(timestamp) {
  return (
    <>
      {timestamp2string(timestamp)}
    </>
  );
}

function renderStatus(status, model_limits_enabled = false) {
  switch (status) {
    case 1:
      if (model_limits_enabled) {
        return <Tag color="green" size="large">已启用：限制模型</Tag>;
      } else {
        return <Tag color="green" size="large">已启用</Tag>;
      }
    case 2:
      return <Tag color="red" size="large"> 已禁用 </Tag>;
    case 3:
      return <Tag color="yellow" size="large"> 已过期 </Tag>;
    case 4:
      return <Tag color="grey" size="large"> 已耗尽 </Tag>;
    default:
      return <Tag color="black" size="large"> 未知状态 </Tag>;
  }
}

const TokensTable = () => {

  const link_menu = [
    {
      node: 'item', key: 'next', name: 'ChatGPT Next Web', onClick: () => {
        onOpenLink('next');
      }
    },
    { node: 'item', key: 'ama', name: 'AMA 问天', value: 'ama' },
    {
      node: 'item', key: 'next-mj', name: 'ChatGPT Web & Midjourney', value: 'next-mj', onClick: () => {
        onOpenLink('next-mj');
      }
    },
    { node: 'item', key: 'opencat', name: 'OpenCat', value: 'opencat' },
    {
      node: 'item', key: 'lobechat', name: 'LobeChat', onClick: () => {
        onOpenLink('lobechat');
      }
    }
  ];

  const columns = [
    {
      title: '名称',
      dataIndex: 'name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text, record, index) => {
        return (
          <div>
            {renderStatus(text, record.model_limits_enabled)}
          </div>
        );
      }
    },
    {
      title: '已用额度',
      dataIndex: 'used_quota',
      render: (text, record, index) => {
        return (
          <div>
            {renderQuota(parseInt(text))}
          </div>
        );
      }
    },
    {
      title: '剩余额度',
      dataIndex: 'remain_quota',
      render: (text, record, index) => {
        return (
          <div>
            {record.unlimited_quota ? <Tag size={'large'} color={'white'}>无限制</Tag> :
              <Tag size={'large'} color={'light-blue'}>{renderQuota(parseInt(text))}</Tag>}
          </div>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_time',
      render: (text, record, index) => {
        return (
          <div>
            {renderTimestamp(text)}
          </div>
        );
      }
    },
    {
      title: '过期时间',
      dataIndex: 'expired_time',
      render: (text, record, index) => {
        return (
          <div>
            {record.expired_time === -1 ? '永不过期' : renderTimestamp(text)}
          </div>
        );
      }
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          <Popover
            content={
              'sk-' + record.key
            }
            style={{ padding: 20 }}
            position="top"
          >
            <Button theme="light" type="tertiary" style={{ marginRight: 1 }}>查看</Button>
          </Popover>
          <Button theme="light" type="secondary" style={{ marginRight: 1 }}
                  onClick={async (text) => {
                    await copyText('sk-' + record.key);
                  }}
          >复制</Button>
          <SplitButtonGroup style={{ marginRight: 1 }} aria-label="项目操作按钮组">
            <Button theme="light" style={{ color: 'rgba(var(--semi-teal-7), 1)' }} onClick={() => {
              onOpenLink('next', record.key);
            }}>聊天</Button>
            <Dropdown trigger="click" position="bottomRight" menu={
              [
                {
                  node: 'item',
                  key: 'next',
                  disabled: !localStorage.getItem('chat_link'),
                  name: 'ChatGPT Next Web',
                  onClick: () => {
                    onOpenLink('next', record.key);
                  }
                },
                {
                  node: 'item',
                  key: 'next-mj',
                  disabled: !localStorage.getItem('chat_link2'),
                  name: 'ChatGPT Web & Midjourney',
                  onClick: () => {
                    onOpenLink('next-mj', record.key);
                  }
                },
                {
                  node: 'item', key: 'ama', name: 'AMA 问天（BotGem）', onClick: () => {
                    onOpenLink('ama', record.key);
                  }
                },
                {
                  node: 'item', key: 'opencat', name: 'OpenCat', onClick: () => {
                    onOpenLink('opencat', record.key);
                  }
                },
                {
                  node: 'item', key: 'lobechat', name: 'LobeChat', onClick: () => {
                    onOpenLink('lobechat');
                  }
                }
              ]
            }
            >
              <Button style={{ padding: '8px 4px', color: 'rgba(var(--semi-teal-7), 1)' }} type="primary"
                      icon={<IconTreeTriangleDown />}></Button>
            </Dropdown>
          </SplitButtonGroup>
          <Popconfirm
            title="确定是否要删除此令牌？"
            content="此修改将不可逆"
            okType={'danger'}
            position={'left'}
            onConfirm={() => {
              manageToken(record.id, 'delete', record).then(
                () => {
                  removeRecord(record.key);
                }
              );
            }}
          >
            <Button theme="light" type="danger" style={{ marginRight: 1 }}>删除</Button>
          </Popconfirm>
          {
            record.status === 1 ?
              <Button theme="light" type="warning" style={{ marginRight: 1 }} onClick={
                async () => {
                  manageToken(
                    record.id,
                    'disable',
                    record
                  );
                }
              }>禁用</Button> :
              <Button theme="light" type="secondary" style={{ marginRight: 1 }} onClick={
                async () => {
                  manageToken(
                    record.id,
                    'enable',
                    record
                  );
                }
              }>启用</Button>
          }
          <Button theme="light" type="tertiary" style={{ marginRight: 1 }} onClick={
            () => {
              setEditingToken(record);
              setShowEdit(true);
            }
          }>编辑</Button>
        </div>
      )
    }
  ];

  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [showEdit, setShowEdit] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [tokenCount, setTokenCount] = useState(pageSize);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchToken, setSearchToken] = useState('');
  const [searching, setSearching] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [targetTokenIdx, setTargetTokenIdx] = useState(0);
  const [editingToken, setEditingToken] = useState({
    id: undefined
  });
  const [orderBy, setOrderBy] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const closeEdit = () => {
    setShowEdit(false);
    setTimeout(() => {
      setEditingToken({
        id: undefined
      });
    }, 500);
  };

  const setTokensFormat = (tokens) => {
    setTokens(tokens);
    if (tokens.length >= pageSize) {
      setTokenCount(tokens.length + pageSize);
    } else {
      setTokenCount(tokens.length);
    }
  };

  let pageData = tokens.slice((activePage - 1) * pageSize, activePage * pageSize);
  const loadTokens = async (startIdx) => {
    setLoading(true);
    const res = await API.get(`/api/token/?p=${startIdx}&size=${pageSize}&order=${orderBy}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setTokensFormat(data);
      } else {
        let newTokens = [...tokens];
        newTokens.splice(startIdx * pageSize, data.length, ...data);
        setTokensFormat(newTokens);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(tokens.length / pageSize) + 1) {
        // In this case we have to load more data and then append them.
        await loadTokens(activePage - 1, orderBy);
      }
      setActivePage(activePage);
    })();
  };

  const refresh = async () => {
    await loadTokens(activePage - 1);
  };

  const onCopy = async (type, key) => {
    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      status = JSON.parse(status);
      serverAddress = status.server_address;
    }
    if (serverAddress === '') {
      serverAddress = window.location.origin;
    }
    let encodedServerAddress = encodeURIComponent(serverAddress);
    const nextLink = localStorage.getItem('chat_link');
    const mjLink = localStorage.getItem('chat_link2');
    let nextUrl;

    if (nextLink) {
      nextUrl = nextLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
    } else {
      nextUrl = `https://app.nextchat.dev/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
    }

    let url;
    switch (type) {
      case 'ama':
        url = mjLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        break;
      case 'opencat':
        url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
        break;
      case 'next':
        url = nextUrl;
        break;
      default:
        url = `sk-${key}`;
    }
    // if (await copy(url)) {
    //     showSuccess('已复制到剪贴板！');
    // } else {
    //     showWarning('无法复制到剪贴板，请手动复制，已将令牌填入搜索框。');
    //     setSearchKeyword(url);
    // }
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('已复制到剪贴板！');
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: '无法复制到剪贴板，请手动复制', content: text });
    }
  };

  const onOpenLink = async (type, key) => {
    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      status = JSON.parse(status);
      serverAddress = status.server_address;
    }
    if (serverAddress === '') {
      serverAddress = window.location.origin;
    }
    let encodedServerAddress = encodeURIComponent(serverAddress);
    const chatLink = localStorage.getItem('chat_link');
    const mjLink = localStorage.getItem('chat_link2');
    let defaultUrl;

    if (chatLink) {
      defaultUrl = chatLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
    }
    let url;
    switch (type) {
      case 'ama':
        url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
        break;
      case 'opencat':
        url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
        break;
      case 'next-mj':
        url = mjLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        break;
      case 'lobechat':
        url = chatLink + `/?settings={"keyVaults":{"openai":{"apiKey":"sk-${key}","baseURL":"${serverAddress}/v1"}}}`;
        break;
      default:
        if (!chatLink) {
          showError('管理员未设置聊天链接');
          return;
        }
        url = defaultUrl;
    }

    window.open(url, '_blank');
  };

  useEffect(() => {
    loadTokens(0, orderBy)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, [pageSize, orderBy]);

  const removeRecord = key => {
    let newDataSource = [...tokens];
    if (key != null) {
      let idx = newDataSource.findIndex(data => data.key === key);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setTokensFormat(newDataSource);
      }
    }
  };

  const manageToken = async (id, action, record) => {
    setLoading(true);
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/token/${id}`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/token/?status_only=true', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/token/?status_only=true', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess('操作成功完成！');
      let token = res.data.data;
      let newTokens = [...tokens];
      // let realIdx = (activePage - 1) * ITEMS_PER_PAGE + idx;
      if (action === 'delete') {

      } else {
        record.status = token.status;
        // newTokens[realIdx].status = token.status;
      }
      setTokensFormat(newTokens);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const searchTokens = async () => {
    if (searchKeyword === '' && searchToken === '') {
      // if keyword is blank, load files instead.
      await loadTokens(0);
      setActivePage(1);
      setOrderBy('');
      return;
    }
    setSearching(true);
    const res = await API.get(`/api/token/search?keyword=${searchKeyword}&token=${searchToken}`);
    const { success, message, data } = res.data;
    if (success) {
      setTokensFormat(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (value) => {
    setSearchKeyword(value.trim());
  };

  const handleSearchTokenChange = async (value) => {
    setSearchToken(value.trim());
  };

  const sortToken = (key) => {
    if (tokens.length === 0) return;
    setLoading(true);
    let sortedTokens = [...tokens];
    sortedTokens.sort((a, b) => {
      return ('' + a[key]).localeCompare(b[key]);
    });
    if (sortedTokens[0].id === tokens[0].id) {
      sortedTokens.reverse();
    }
    setTokens(sortedTokens);
    setLoading(false);
  };


  const handlePageChange = page => {
    setActivePage(page);
    if (page === Math.ceil(tokens.length / pageSize) + 1) {
      // In this case we have to load more data and then append them.
      loadTokens(page - 1).then(r => {
      });
    }
  };

  const rowSelection = {
    onSelect: (record, selected) => {
    },
    onSelectAll: (selected, selectedRows) => {
    },
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedKeys(selectedRows);
    }
  };

  const handleRow = (record, index) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)'
        }
      };
    } else {
      return {};
    }
  };

  const handleOrderByChange = (e, { value }) => {
    setOrderBy(value);
    setActivePage(1);
    setDropdownVisible(false);
  };

  const renderSelectedOption = (orderBy) => {
    switch (orderBy) {
      case 'remain_quota':
        return '按剩余额度排序';
      case 'used_quota':
        return '按已用额度排序';
      default:
        return '默认排序';
    }
  };

  return (
    <>
      <EditToken refresh={refresh} editingToken={editingToken} visiable={showEdit} handleClose={closeEdit}></EditToken>
      <Form layout="horizontal" style={{ marginTop: 10 }} labelPosition={'left'}>
        <Form.Input
          field="keyword"
          label="搜索关键字"
          placeholder="令牌名称"
          value={searchKeyword}
          loading={searching}
          onChange={handleKeywordChange}
        />
        {/* <Form.Input
          field="token"
          label="Key"
          placeholder="密钥"
          value={searchToken}
          loading={searching}
          onChange={handleSearchTokenChange}
        /> */}
        <Button label="查询" type="primary" htmlType="submit" className="btn-margin-right"
                onClick={searchTokens} style={{ marginRight: 8 }}>查询</Button>
      </Form>

      <Table style={{ marginTop: 20 }} columns={columns} dataSource={pageData} pagination={{
        currentPage: activePage,
        pageSize: pageSize,
        total: tokenCount,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        formatPageText: (page) => `第 ${page.currentStart} - ${page.currentEnd} 条，共 ${tokens.length} 条`,
        onPageSizeChange: (size) => {
          setPageSize(size);
          setActivePage(1);
        },
        onPageChange: handlePageChange
      }} loading={loading} rowSelection={rowSelection} onRow={handleRow}>
      </Table>
      <Button theme="light" type="primary" style={{ marginRight: 8 }} onClick={
        () => {
          setEditingToken({
            id: undefined
          });
          setShowEdit(true);
        }
      }>添加令牌</Button>
      <Button label="复制所选令牌" type="warning" onClick={
        async () => {
          if (selectedKeys.length === 0) {
            showError('请至少选择一个令牌！');
            return;
          }
          let keys = '';
          for (let i = 0; i < selectedKeys.length; i++) {
            keys += selectedKeys[i].name + '    sk-' + selectedKeys[i].key + '\n';
          }
          await copyText(keys);
        }
      }>复制所选令牌到剪贴板</Button>
      <Dropdown
        trigger="click"
        position="bottomLeft"
        visible={dropdownVisible}
        onVisibleChange={(visible) => setDropdownVisible(visible)}
        render={
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: '' })}>默认排序</Dropdown.Item>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: 'remain_quota' })}>按剩余额度排序</Dropdown.Item>
            <Dropdown.Item onClick={() => handleOrderByChange('', { value: 'used_quota' })}>按已用额度排序</Dropdown.Item>
          </Dropdown.Menu>
        }
      >
      <Button style={{ marginLeft: '10px' }}>{renderSelectedOption(orderBy)}</Button>
      </Dropdown>
    </>
  );
};

export default TokensTable;
