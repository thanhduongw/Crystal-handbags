import { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Button,
    Card,
    Col,
    Empty,
    Form,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    Upload,
} from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    LockOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    UnlockOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    createUser,
    deleteUserAvatar,
    getAllUsers,
    updateUser,
    uploadUserAvatar,
} from '../../api/userAPI';
import type { Gender, UserProfileDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const LOCKED_USERS_KEY = 'admin-locked-user-ids';

type UserFormValues = {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender?: Gender;
    dob?: string;
    roles: string[];
};

type UserStatusFilter = 'ACTIVE' | 'LOCKED';

const roleOptions = [
    { value: 'CUSTOMER', label: 'Khach hang' },
    { value: 'ADMIN', label: 'Admin' },
];

const genderOptions = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nu' },
    { value: 'OTHER', label: 'Khac' },
];

function hasAdminRole(user: UserProfileDto) {
    return user.roles?.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN') ?? false;
}

function getPrimaryRole(user: UserProfileDto) {
    if (hasAdminRole(user)) return 'ADMIN';
    return user.roles?.[0] || 'CUSTOMER';
}

function getFullName(user: UserProfileDto) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-';
}

function getInitials(user: UserProfileDto) {
    const source = getFullName(user) !== '-' ? getFullName(user) : user.email;
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');
}

function readLockedUsers() {
    try {
        const value = window.localStorage.getItem(LOCKED_USERS_KEY);
        if (!value) return new Set<number>();
        const ids = JSON.parse(value) as number[];
        return new Set(ids.filter(id => typeof id === 'number'));
    } catch {
        return new Set<number>();
    }
}

export default function AdminUsers() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfileDto[]>([]);
    const [lockedUserIds, setLockedUserIds] = useState<Set<number>>(() => readLockedUsers());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfileDto | null>(null);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<UserStatusFilter | undefined>();

    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>();
    const [avatarUrl, setAvatarUrl] = useState<string>();

    const [form] = Form.useForm<UserFormValues>();

    useEffect(() => {
        void load();
    }, []);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const persistLockedUsers = (next: Set<number>) => {
        setLockedUserIds(next);
        window.localStorage.setItem(LOCKED_USERS_KEY, JSON.stringify(Array.from(next)));
    };

    const resetAvatarState = () => {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setSelectedAvatarFile(null);
        setAvatarPreview(undefined);
        setAvatarUrl(undefined);
    };

    const load = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data.filter(user => !hasAdminRole(user)));
        } catch (error) {
            console.error('Load users error:', error);
            message.error('Tai nguoi dung that bai');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();

        return users.filter(user => {
            const userId = user.userId;
            const isLocked = typeof userId === 'number' && lockedUserIds.has(userId);
            const matchesSearch = !keyword ||
                getFullName(user).toLowerCase().includes(keyword) ||
                user.email.toLowerCase().includes(keyword) ||
                (user.phoneNumber || '').toLowerCase().includes(keyword);
            const matchesRole = !roleFilter || getPrimaryRole(user) === roleFilter;
            const matchesStatus = !statusFilter ||
                (statusFilter === 'LOCKED' && isLocked) ||
                (statusFilter === 'ACTIVE' && !isLocked);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchText, roleFilter, statusFilter, lockedUserIds]);

    const openCreateModal = () => {
        setEditingUser(null);
        resetAvatarState();
        form.resetFields();
        form.setFieldsValue({ roles: ['CUSTOMER'] });
        setModalVisible(true);
    };

    const openEditModal = (user: UserProfileDto) => {
        setEditingUser(user);

        form.setFieldsValue({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            dob: user.dob,
            roles: user.roles?.length ? user.roles : ['CUSTOMER'],
        });

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setSelectedAvatarFile(null);
        setAvatarPreview(undefined);
        setAvatarUrl(user.photoUrl);

        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        resetAvatarState();
    };

    const handleSelectAvatar = (file: File) => {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setSelectedAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        return false;
    };

    const handleDeleteAvatar = async () => {
        if (!editingUser?.userId) return;

        try {
            setSaving(true);

            if (selectedAvatarFile || avatarPreview) {
                setSelectedAvatarFile(null);
                setAvatarPreview(undefined);

                if (!avatarUrl) {
                    message.success('Da bo anh vua chon');
                    return;
                }
            }

            const updatedUser = await deleteUserAvatar(editingUser.userId);

            setAvatarUrl(updatedUser.photoUrl);
            await load();

            message.success('Da xoa anh dai dien');
        } catch (error) {
            console.error('Delete avatar error:', error);
            message.error('Xoa anh dai dien that bai');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (values: UserFormValues) => {
        try {
            setSaving(true);

            if (editingUser?.userId) {
                await updateUser(editingUser.userId, {
                    email: editingUser.email,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phoneNumber: values.phoneNumber,
                    gender: values.gender,
                    dob: values.dob,
                    roles: values.roles,
                });

                if (selectedAvatarFile) {
                    await uploadUserAvatar(editingUser.userId, selectedAvatarFile);
                }

                message.success('Cap nhat nguoi dung thanh cong');
            } else {
                await createUser({
                    email: values.email,
                    password: values.password || '',
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phoneNumber: values.phoneNumber,
                    roles: values.roles,
                });

                message.success('Them nguoi dung thanh cong');
            }

            closeModal();
            await load();
        } catch (error) {
            console.error('Save user error:', error);
            message.error(editingUser ? 'Cap nhat that bai' : 'Them nguoi dung that bai');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = (user: UserProfileDto) => {
        if (!user.userId) return;

        const next = new Set(lockedUserIds);
        const isLocked = next.has(user.userId);

        if (isLocked) {
            next.delete(user.userId);
            message.success('Da mo khoa trang thai UI');
        } else {
            next.add(user.userId);
            message.success('Da khoa trang thai UI');
        }

        persistLockedUsers(next);
    };

    const activeUsers = users.filter(user => !user.userId || !lockedUserIds.has(user.userId)).length;
    const lockedUsers = users.length - activeUsers;

    const columns: ColumnsType<UserProfileDto> = [
        {
            title: 'Khach hang',
            key: 'customer',
            width: 300,
            render: (_, record) => (
                <div className="admin-entity-cell">
                    <Avatar size={44} src={record.photoUrl} icon={!record.photoUrl ? undefined : <UserOutlined />}>
                        {!record.photoUrl ? getInitials(record) : null}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                        <div className="admin-entity-title">{getFullName(record)}</div>
                        <div className="admin-entity-meta">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'So dien thoai',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 150,
            render: (phone?: string) => phone || <span className="admin-muted">Chua co</span>,
        },
        {
            title: 'Ngay dang ky',
            key: 'registeredAt',
            width: 140,
            render: () => <span className="admin-muted">--</span>,
        },
        {
            title: 'Order Count',
            key: 'orderCount',
            width: 120,
            align: 'center',
            render: () => <span className="admin-muted">--</span>,
        },
        {
            title: 'Vai tro',
            key: 'roles',
            width: 130,
            render: (_, record) => {
                const role = getPrimaryRole(record);
                return (
                    <Tag className="admin-tag" color={role === 'ADMIN' ? 'red' : 'blue'}>
                        {role === 'ADMIN' ? 'Admin' : 'Khach hang'}
                    </Tag>
                );
            },
        },
        {
            title: 'Trang thai',
            key: 'status',
            width: 120,
            render: (_, record) => {
                const isLocked = !!record.userId && lockedUserIds.has(record.userId);
                return (
                    <Tag className="admin-tag" color={isLocked ? 'red' : 'green'}>
                        {isLocked ? 'Da khoa' : 'Hoat dong'}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tac',
            key: 'action',
            width: 150,
            fixed: 'right',
            align: 'right',
            render: (_, record) => {
                const isLocked = !!record.userId && lockedUserIds.has(record.userId);
                return (
                    <Space size={4}>
                        <Tooltip title="Sua khach hang">
                            <Button
                                className="admin-icon-button"
                                icon={<EditOutlined />}
                                onClick={() => openEditModal(record)}
                            />
                        </Tooltip>
                        <Tooltip title={isLocked ? 'Mo khoa tai khoan' : 'Khoa tai khoan'}>
                            <Button
                                className="admin-icon-button"
                                danger={!isLocked}
                                icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
                                onClick={() => handleToggleLock(record)}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Khach hang</div>
                    <Title level={2} className="admin-page-title">Tai khoan nguoi dung</Title>
                    <p className="admin-page-subtitle">
                        Quan ly ho so khach hang, loc theo vai tro va trang thai khoa cuc bo.
                    </p>
                </div>
                <div className="admin-page-actions">
                    <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                        Lam moi
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        Them khach hang
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Tong khach hang</div>
                        <div className="admin-stat-value">{users.length}</div>
                        <div className="admin-stat-footnote">Khong bao gom tai khoan quan tri</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Hoat dong</div>
                        <div className="admin-stat-value">{activeUsers}</div>
                        <div className="admin-stat-footnote">Trang thai hien thi tren frontend</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Da khoa</div>
                        <div className="admin-stat-value">{lockedUsers}</div>
                        <div className="admin-stat-footnote">Luu bang localStorage khi chua co API</div>
                    </Card>
                </Col>
            </Row>

            <Card className="admin-toolbar-card">
                <Row gutter={[12, 12]}>
                    <Col xs={24} lg={12}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tim theo ho ten, email hoac so dien thoai..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Vai tro"
                            value={roleFilter}
                            onChange={setRoleFilter}
                            options={roleOptions}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Trang thai"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'ACTIVE', label: 'Hoat dong' },
                                { value: 'LOCKED', label: 'Da khoa' },
                            ]}
                        />
                    </Col>
                </Row>
            </Card>

            <Card className="admin-table-card">
                <Table
                    rowKey="userId"
                    columns={columns}
                    dataSource={filteredUsers}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} khach hang`,
                        showSizeChanger: true,
                    }}
                    scroll={{ x: 1110 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Khong co khach hang phu hop" /> }}
                />
            </Card>

            <Modal
                open={modalVisible}
                title={editingUser ? 'Sua khach hang' : 'Them khach hang'}
                onCancel={closeModal}
                onOk={() => form.submit()}
                okText={editingUser ? 'Cap nhat' : 'Them'}
                cancelText="Huy"
                confirmLoading={saving}
                destroyOnHidden
                width={720}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={12}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ required: true, type: 'email', message: 'Email khong hop le' }]}
                            >
                                <Input disabled={!!editingUser} />
                            </Form.Item>
                        </Col>
                        {!editingUser && (
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="password"
                                    label="Mat khau"
                                    rules={[{ required: true, min: 6, message: 'Mat khau toi thieu 6 ky tu' }]}
                                >
                                    <Input.Password />
                                </Form.Item>
                            </Col>
                        )}
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="lastName"
                                label="Ho"
                                rules={[{ required: true, message: 'Vui long nhap ho' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="firstName"
                                label="Ten"
                                rules={[{ required: true, message: 'Vui long nhap ten' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="phoneNumber"
                                label="So dien thoai"
                                rules={[
                                    { required: true, message: 'Vui long nhap so dien thoai' },
                                    { pattern: /^[0-9]{10}$/, message: 'So dien thoai khong hop le' },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="gender" label="Gioi tinh">
                                <Select allowClear options={genderOptions} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="dob" label="Ngay sinh">
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="roles"
                                label="Vai tro"
                                rules={[{ type: 'array', required: true, min: 1, message: 'Vui long chon vai tro' }]}
                            >
                                <Select mode="multiple" options={roleOptions} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {editingUser && (
                        <Form.Item label="Anh dai dien">
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <Avatar
                                    size={96}
                                    src={avatarPreview || avatarUrl}
                                    icon={!avatarPreview && !avatarUrl ? undefined : <UserOutlined />}
                                >
                                    {!avatarPreview && !avatarUrl ? getInitials(editingUser) : null}
                                </Avatar>

                                <Space>
                                    <Upload
                                        showUploadList={false}
                                        accept="image/*"
                                        beforeUpload={handleSelectAvatar}
                                    >
                                        <Button icon={<UploadOutlined />}>
                                            Chon anh
                                        </Button>
                                    </Upload>

                                    {(avatarPreview || avatarUrl) && (
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={handleDeleteAvatar}
                                            loading={saving}
                                        >
                                            Xoa anh
                                        </Button>
                                    )}
                                </Space>
                            </Space>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
}
