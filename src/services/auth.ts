const API_BASE = '/v1/auth'; // バックエンドAPIルート (v1/auth)

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('ログインに失敗しました');
  return response.json();
};

export const signUp = async (username, password, email) => {
  const response = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  if (!response.ok) throw new Error('登録に失敗しました');
  return response.json();
};
