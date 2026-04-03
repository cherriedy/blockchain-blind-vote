export function buildEmailTemplate(
  title: string,
  content: string,
  color: string = '#4CAF50' // default green
) {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: ${color}; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">${title}</h2>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #777;">
        Voting System © ${new Date().getFullYear()}
      </div>

    </div>
  </div>
  `;
}