export const logSection = (...lines: string[]) => {
  const border = '='.repeat(50)
  console.log(border)
  lines.forEach((line) => console.log(line))
  console.log(border)
}

export const logErrorSection = (...lines: string[]) => {
  const border = '!'.repeat(50)
  console.error(border)
  lines.forEach((line) => console.error(line))
  console.error(border)
}


