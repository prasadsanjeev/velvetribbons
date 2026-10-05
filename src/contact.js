const form = document.getElementById('enquiry-form');
const button = document.getElementById('send-enquiry');
const status = document.getElementById('form-status');

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled || !form.reportValidity()) return;
  button.disabled = true;
  button.textContent = 'Sending…';
  form.setAttribute('aria-busy', 'true');
  status.textContent = 'Sending your enquiry…';
  const fields = new FormData(form);
  try {
    const response = await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fields.get('name').trim(),
        email: fields.get('email').trim(),
        occasion: fields.get('occasion'),
        details: fields.get('details').trim(),
        website: fields.get('website')
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error('Enquiry failed');
    if (!result.message) throw new Error('Unexpected response');
    form.reset();
    status.textContent = 'Thank you! Your enquiry has been sent. We will reply within one business day.';
  } catch {
    // Keep the enquiry in place so the visitor can retry without retyping it.
    status.textContent = 'We could not confirm your enquiry was sent. Please try again later or contact us on Instagram.';
  } finally {
    button.disabled = false;
    button.textContent = 'Send enquiry';
    form.removeAttribute('aria-busy');
    status.focus();
  }
});
