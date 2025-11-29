import { Table, Button, InputNumber, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import useCart from '../hooks/useCart';
import type { CartLine } from '../types';

const { Title } = Typography;

export default function Cart() {
    const { lines, updateQty, removeItem, total } = useCart();

    const columns = [
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        {
            title: 'Ảnh', key: 'img', render: (_: any, r: CartLine) =>
                <img /* src={r.avatar} */ src={"https://placehold.co/600x400"} alt="" width={60} />
        },
        { title: 'Đơn giá', dataIndex: 'price', render: (p: number) => `${p.toLocaleString()} đ` },
        {
            title: 'Số lượng', key: 'qty', render: (_: any, r: CartLine) => (
                <InputNumber min={1} value={r.qty}
                    onChange={val => updateQty(r.itemId, (val || 0) - r.qty)} />
            )
        },
        {
            title: 'Thành tiền', key: 'total', render: (_: any, r: CartLine) =>
                `${(r.price * r.qty).toLocaleString()} đ`
        },
        {
            title: '', key: 'del', render: (_: any, r: CartLine) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(r.itemId)} />
            )
        },
    ];

    return (
        <>
            <Title level={3}>Giỏ hàng</Title>
            <Table rowKey="itemId" columns={columns} dataSource={lines} pagination={false} />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Title level={4}>Tổng cộng: {total.toLocaleString()} đ</Title>
                <Button type="primary" size="large">Tiến hành đặt hàng</Button>
            </div>
        </>
    );
}