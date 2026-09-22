# FrontendManagementStudent

MaivenPoint Assignment
my-app/
├── public/
├── src/
│ ├── assets/
│ ├── components/
│ │ ├── common/ # PageLoader, ErrorBoundary...
│ │ └── ui/ # Button, Input, Modal...
│ ├── config/
│ │ └── env.js # API_BASE_URL (đã viết)
│ ├── features/
│ │ ├── auth/
│ │ │ ├── components/ # LoginForm, RegisterForm (sẽ viết)
│ │ │ ├── context/
│ │ │ │ └── AuthContext.jsx # AuthContext(đã viết) + AuthProvider (sẽ viết)
│ │ │ ├── hooks/
│ │ │ │ └── useAuth.js # bọc useContext (sẽ viết)
│ │ │ ├── services/
│ │ │ │ └── authService.js # login, adminLogin, register (đã viết)
│ │ │ └── index.js # public API của feature auth
│ │ └── users/
│ │ ├── components/ # danh sách, form tạo giảng viên (sẽ viết)
│ │ ├── hooks/
│ │ ├── services/
│ │ │ └── userService.js # POST /api/teachers, ... (sẽ viết)
│ │ └── index.js
│ ├── hooks/ # custom hooks dùng chung (chưa cần)
│ ├── layouts/
│ │ └── Layout.jsx
│ ├── pages/
│ │ ├── Login.jsx # làm bây giờ
│ │ ├── Register.jsx # làm bây giờ
│ │ ├── Users.jsx # làm bây giờ (admin)
│ │ ├── NotFound.jsx # không làm
│ │ └── ... # các page còn lại để sau
│ ├── routes/
│ │ ├── routeConfig.jsx # route + menu + roles (sẽ viết)
│ │ └── ProtectedRoute.jsx # guard theo đăng nhập/role (sẽ viết)
│ ├── services/
│ │ └── axiosClient.js # axios instance + interceptor (đã viết)
│ ├── store/ # ĐỂ TRỐNG, bỏ Zustand
│ ├── utils/
│ │ └── authStorage.js # đọc/ghi token localStorage (đã viết)
│ ├── App.jsx
│ ├── main.jsx # bọc <AuthProvider>, đăng ký 401
│ └── index.css
├── .env # VITE_API_BASE_URL
├── jsconfig.json # alias @ -> src
├── tailwind.config.js
└── vite.config.js # alias @ -> src
