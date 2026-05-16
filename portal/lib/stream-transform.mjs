// Converts `claude --output-format stream-json` events into readable log text.
// Runs as a standalone process inside the detached pipeline, so it is
// independent of the Next.js server lifecycle.
import readline from 'node:readline'

const rl = readline.createInterface({ input: process.stdin })

function summarizeInput(name, input) {
  if (!input || typeof input !== 'object') return ''
  if (name === 'Bash') return String(input.command ?? '').slice(0, 300)
  if (name === 'Agent') return String(input.description ?? input.subagent_type ?? '')
  if (name === 'Read' || name === 'Edit' || name === 'Write') return String(input.file_path ?? '')
  if (name === 'Skill') return String(input.skill ?? '')
  const s = JSON.stringify(input)
  return s.length > 200 ? s.slice(0, 200) + '…' : s
}

function textFrom(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map(b => (b && b.type === 'text' ? b.text : ''))
    .filter(Boolean)
    .join('\n')
}

function out(s) {
  if (s && s.trim()) process.stdout.write(s.replace(/\n+$/, '') + '\n')
}

rl.on('line', (line) => {
  if (!line.trim()) return
  let o
  try { o = JSON.parse(line) } catch { out(line); return }

  if (o.type === 'assistant' && o.message?.content) {
    for (const block of o.message.content) {
      if (block.type === 'text' && block.text?.trim()) out(block.text)
      else if (block.type === 'tool_use') out(`→ ${block.name}: ${summarizeInput(block.name, block.input)}`)
    }
  }
  // tool_result blocks (file contents / command output) and 'result' type are skipped
})
