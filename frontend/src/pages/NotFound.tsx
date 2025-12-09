// src/pages/NotFound.tsx
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

// thêm từ khóa default
export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <Result
                status="404"
                title="404"
                subTitle="Xin lỗi, trang bạn tìm kiếm không tồn tại."
                extra={
                    <Button type="primary" onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                }
            />
        </div>
    );
}