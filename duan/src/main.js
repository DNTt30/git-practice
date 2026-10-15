import './style.css'

// Đổi giao diện Sáng / Tối (Dark mode)
const themeToggleBtn = document.querySelector('#theme-toggle')
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark')
  })
}

// Xử lý gửi Form tư vấn
const form = document.querySelector('#consultation-form')
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const fullName = document.querySelector('#full-name')?.value || 'bạn'
    alert(`Cảm ơn ${fullName}! Codestar Academy đã nhận thông tin tư vấn và sẽ liên hệ với bạn sớm nhất.`)
    form.reset()
  })
}
