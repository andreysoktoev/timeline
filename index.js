const minuteInMs = 60000
const hourInMs = minuteInMs * 60
const dayInMs = hourInMs * 24
const weekInMs = dayInMs * 7

let events = []
const eventsQuantity = 100
const statuses = [
  ['COMPLETED', '#FF6400'],
  ['CONFIRMED', '#90EE90'],
  ['CLIENT_CONFIRMED', '#003CFF'],
  ['RECEIVED', '#FFC400'],
  ['LIVE', '#FF6400'],
  ['PENDING', '#90EE90'],
  ['CANCELLED', '#003CFF'],
  ['LATE_CANCELLED', '#FFC400'],
  ['POSTPONED', '#FF6400'],
  ['FAILED', '#FFC400']
]

for (i = 0; i < eventsQuantity; i++) {

  const month = d3.randomInt(1, 13)()
  const day = d3.randomInt(18, 25)()
  const hour = d3.randomInt(0, 24)()
  const minute = d3.randomInt(0, 60)()

  const ServiceStartLength = d3.randomInt(minuteInMs, hourInMs)()
  const Length = d3.randomInt(hourInMs, hourInMs * 12)()
  const ServiceEndLength = d3.randomInt(minuteInMs, hourInMs)()

  const serviceStartTime = Date.parse(`2021-${10}-${day} ${hour}:${minute}`)
  const startTime = serviceStartTime + ServiceStartLength
  const endTime = startTime + Length
  const serviceEndTime = endTime + ServiceEndLength
  const categories = ['Category', 'Category 2', 'Category 3', 'Category 4']

  events.push({
    serviceStartTime: new Date(serviceStartTime),
    serviceEndTime: new Date(serviceEndTime),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    description: 'Description',
    category: categories[d3.randomInt(0, categories.length)()],
    status: statuses[d3.randomInt(0, statuses.length)()][0],
    title: 'TITLE: Lorem Ipsum Sit Dolor Xxxx',
    groupId: d3.randomInt(0, 2)()
  })

}

events = events.sort((a, b) =>
  a.serviceStartTime - b.serviceStartTime || a.serviceEndTime - b.serviceEndTime
)
const categories = [...new Set(events.map(i => i.category))].sort((a, b) => d3.ascending(a, b))

let width = document.documentElement.clientWidth
let height = document.documentElement.clientHeight

const axisTopHeight = 46
const marginTop = 62
const cellStrokeWidth = 6
let cellHeight = 52
const cellWidthMin = cellHeight * 2
const cellPaddingTop = 29
const cellPaddingLeft = 10
const gapY = 16
const gapX = 16
const cellColor = (d) => statuses[statuses.map(i => i[0]).indexOf(d.status)][1]
const cellTextColor = 'white'
const cellRadius = 6
const time = d3.timeFormat('%H:%M')
const brushHeight = 49
const sm = width * dayInMs / 320
let rows, groups, zoombrush, rowsHeight, chartHeight, evenDaysWidth
let groupped = 0
let indent = gapY

const svgBack = d3
  .select('#d3')
  .append('svg')
  .attr('class', 'svgBack')

const svgTop = d3.select('#d3')
  .append('svg')
  .attr('width', '100%')
  .attr('height', axisTopHeight)

const wrapper = d3.select('#d3')
  .append('div')
  .attr('class', 'wrapper')

const svg = wrapper.append('svg')
  .attr('width', '100%')

const todaySvg = d3.select('#d3')
  .append('svg')
  .attr('class', 'todaySvg')

const svgBottom = d3.select('#d3')
  .append('svg')
  .attr('width', '100%')
  .attr('height', brushHeight)
  .attr('class', 'svgBottom')

const dmn = [
  d3.min(events.map(i => i.serviceStartTime)),
  d3.max(events.map(i => i.serviceEndTime))
]

const x = d3
  .scaleTime()
  .domain(dmn)
  .range([0, width])

const xBrush = d3
  .scaleTime()
  .domain([
    x.invert(-gapY),
    x.invert(width + gapY)
  ])
  .range([0, width])

const start = xBrush.domain()[0]// d3.timeDay.offset(xBrush.domain()[0], -1)
const end = xBrush.domain()[1]
const evenDays = d3.timeDay.range(start, end, 2)

svgBack.selectAll('rect')
  .data(evenDays)
  .join('rect')
  .attr('class', 'evenDays')

const gGooey = svgBottom
  .append("g")
  .style("filter", 'url(#gooey)')

const defs = svgBottom.append('defs')
const filter = defs.append('filter').attr('id','gooey')

filter.append('feGaussianBlur')
  .attr('in','SourceGraphic')
  .attr('stdDeviation','10')
  .attr('result','blur')

filter.append('feColorMatrix')
  .attr('in','blur')
  .attr('mode','matrix')
  .attr('values','1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 75 -10')
  .attr('result','gooey')

filter.append('feBlend')
  .attr('in','SourceGraphic')
  .attr('in2','gooey')
  .attr('operator','over')

gGooey.append('rect')
  .style('fill', 'none')
  .attr('width', width)
  .attr('height', brushHeight)

gGooey
  .selectAll('circle')
  .data(events)
  .join('circle')
  .attr('cx', d => xBrush(d.startTime))
  .attr('cy', 17)
  .attr('r', 3)
  .style('fill', '#FF6400')

function cellWidth(d) {
  return d3.max([
    (x(d.startTime) - x(d.serviceStartTime)) + cellWidthMin + (x(d.serviceEndTime) - x(d.endTime)),
    x(d.serviceEndTime) - x(d.serviceStartTime)
  ])
}

function cellWidthFront(d) {
  return d3.max([
    cellWidthMin,
    x(d.endTime) - x(d.startTime)
  ])
}

function y() {
  rows = [-Infinity]
  groups = categories.map(i => [i, [-Infinity]])
  const start = (d) => x(d.serviceStartTime)
  const step = cellHeight + gapY
  const h = document.documentElement.clientHeight - axisTopHeight - brushHeight
  if (!groupped) {
    events.forEach(d => {
      const findIndex = rows.findIndex(i => i < start(d))
      if (findIndex >= 0) {
        rows[findIndex] = start(d) + cellWidth(d) + gapX
        d.y = gapY + step * findIndex
      } else {
        rows.push(start(d) + cellWidth(d) + gapX)
        d.y = gapY + step * (rows.length - 1)
      }
    })
    rowsHeight = gapY + step * rows.length
  } else {
    events.forEach(d => {
      let group = groups[categories.indexOf(d.category)][1]
      const index = categories.indexOf(d.category)
      const indx = groups.slice(0, index).map(i => i[1]).flat().length
      const findIndex = group.findIndex(i => i < start(d))
      if (findIndex >= 0) {
        group[findIndex] = start(d) + cellWidth(d) + gapX
        d.y = gapY * (index + 1) + step * (indx + findIndex) + index
      } else {
        group.push(start(d) + cellWidth(d) + gapX)
        d.y = gapY * (index + 1) + step * (indx + group.length - 1) + index
      }
    })
    groups.forEach((d, i) => {
      const lineIndex = groups.slice(0, i + 1).map(j => j[1]).flat().length
      const lineY = (gapY + 1) * (i + 1) + (cellHeight + gapY) * lineIndex
      svg.select('.' + d[0].match(/\w+/g).join(''))
        .attr('y1', lineY)
        .attr('y2', lineY)
      const textIndex = groups.slice(0, i).map(j => j[1]).flat().length
      const textY = (gapY + 1) * (i + 1) + (cellHeight + gapY) * textIndex + 22
      svg.select('.' + d[0].match(/\w+/g).join('') + 'label')
        .attr('y', textY)
      rowsHeight = lineY - 1
    })
  }
  chartHeight = rowsHeight < h ? '100%' : rowsHeight
  svg.attr('height', chartHeight)
}

const chart = svg.append('g')

const g = chart
  .selectAll('g')
  .data(events)
  .join('g')
  // .on('mouseenter', e => console.log(e.target.__data__))
  .on('click', function() {
    const cb = d3.select(this).select('.cellBack')
    if (cb.classed('selected')) {
      cb.classed('selected', false)
    } else {
      d3.selectAll('.selected').classed('selected', false)
      cb.classed('selected', true)
    }
  })

const todayCircle = todaySvg.append('circle')
  .attr('cy', 4)
  .attr('r', 4)
  .style('fill', '#FF6600')
  .attr('stroke', 'white')

const todayLine = svg.append('line')
  .attr('y1', 0)
  .attr('y2', '100%')
  .attr('vector-effect', 'non-scaling-stroke')
  .attr('shape-rendering', 'crispEdges')
  .attr('stroke', '#FF6600')

const cellBack = g
  .append('rect')
  .attr('width', d => cellWidth(d))
  .attr('height', cellHeight)
  .attr('rx', cellRadius)
  .attr('ry', cellRadius)
  .attr('class', d => d.status === 'LIVE' ? 'cellBack live' : 'cellBack')
  .style('fill', d => d3.interpolate('white', cellColor(d))(0.4))

const cell = g
  .append('rect')
  .attr('height', cellHeight)
  .attr('rx', cellRadius)
  .attr('ry', cellRadius)
  .attr('class', 'cell')
  .style('fill', d => cellColor(d))

const text = g
  .append('foreignObject')
  .attr('height', cellHeight)
  .attr('class', 'text')

text.append('xhtml:div')
  .attr('class', 'category')
  .html(d => {
    if (d.groupId) {
      const htmlCode = `
        <svg width='18' height='11'>
          <rect y='3' width='1' height='6' rx='1' ry='1' fill='white'/>
          <rect x='3' y='1' width='10' height='10' rx='1' ry='1' fill='white'/>
        </svg>
        <a href='#'>${d.category}</a>
      `
      return htmlCode
    } else {
      return `<a href='#'>${d.category}</a>`
    }
  })

text.selectAll('a')
  .on('click', function() {
    groupped = 1
    events = events.sort((a, b) => d3.ascending(a.category, b.category))
    groups = categories.map(i => [i, [-Infinity]])
    text.selectAll('.category').remove()
    cellHeight = 37
    g.selectAll('rect')
      .attr('height', cellHeight)
    y()
    chart.selectAll('g')
      .transition()
      .attr('transform', d => `translate(${x(d.serviceStartTime)}, ${d.y})`)
    groups.forEach((d, i) => {
      console.log(d[0].match(/\w+/g).join(''))
      const lineIndex = groups.slice(0, i + 1).map(j => j[1]).flat().length
      const lineY = (gapY + 1) * (i + 1) + (cellHeight + gapY) * lineIndex
      svg.insert('line', 'g')
        .transition()
        .attr('y1', lineY)
        .attr('y2', lineY)
        .attr('x1', 0)
        .attr('x2', '100%')
        .attr('shape-rendering', 'crispEdges')
        .attr('stroke', '#C3C3C3')
        .attr('class', d[0].match(/\w+/g).join(''))
      const textIndex = groups.slice(0, i).map(j => j[1]).flat().length
      const textY = (gapY + 1) * (i + 1) + (cellHeight + gapY) * textIndex + 22
      svg.append('text')
        .transition()
        .attr('x', 10)
        .attr('y', textY)
        .attr('style', 'font-size: 13px; color: #707070; text-transform: uppercase')
        .attr('class', d[0].match(/\w+/g).join('') + 'label')
        .text(d[0])
    })
  })

text.append('xhtml:div')
  .html(d => `<b>${time(d.startTime)} − ${time(d.endTime)}</b> ${d.title}`)

text.append('xhtml:div')
  .html(d => d.description)

const axisTopDay = d3
  .axisTop(x)
  .ticks(d3.timeDay)
  .tickSize(0)
  .tickFormat(d3.timeFormat('%A'))

const axisTopDate = d3
  .axisTop(x)
  .ticks(d3.timeDay)
  .tickSize(0)
  .tickFormat(d3.timeFormat('%d/%m/%Y'))

const axisTopTime = d3
  .axisTop(x)
  .tickSize(2)
  .tickPadding(3)
  .tickFormat(time)
  .ticks(Math.round(width / 120))

const axisBottomDate = d3
  .axisTop(xBrush)
  .ticks(d3.timeDay)
  .tickSize(5)
  .tickPadding(4)
  .tickFormat(d3.timeFormat('%d/%m/%Y'))

svgTop
  .append('g')
  .attr('transform', `translate(${0}, ${21})`)
  .attr('class', 'axisTopDay')
  .call(axisTopDay)

svgTop
  .append('g')
  .attr('transform', `translate(${0}, ${32})`)
  .attr('class', 'axisTopDate')
  .call(axisTopDate)

svgTop
  .append('g')
  .attr('transform', `translate(${0}, ${45})`)
  .attr('class', 'axisTopTime')
  .call(axisTopTime)

svgBottom.append('line')
  .attr('y1', 1)
  .attr('y2', 1)
  .attr('x1', 0)
  .attr('x2', '100%')
  .attr('vector-effect', 'non-scaling-stroke')
  .attr('shape-rendering', 'crispEdges')
  .attr('stroke', '#C6C6C6')

svgBottom
  .append("g")
  .attr('transform', `translate(${0}, ${brushHeight})`)
  .attr('class', 'axisBottomDate')
  .call(axisBottomDate)
  .select('.domain')
  .remove()

const brush = d3
  .brushX()
  .extent([[0, 1], [width, brushHeight]])
  .on('brush', brushed)

const zoom = d3.zoom()
  .scaleExtent([1, (dmn[1] - dmn[0]) / hourInMs])
  .translateExtent([[0, 0], [width, height]])
  .extent([[0, 0], [width, height]])
  .on("zoom", zoomed)

let sMax = [xBrush(xBrush.invert(width) - sm), width]
let sDay = [xBrush(d3.timeDay.offset(xBrush.invert(width), -1)), width]

const gb = svgBottom
  .append('g')
  .attr('class', 'brush')
  .call(brush)
  .call(brush.move, sDay)

svg.call(zoom)

function brushed(e) {
  if (zoombrush) return
  zoombrush = 1
  const s = e.selection
  if (xBrush.invert(s[1]) - xBrush.invert(s[0]) < hourInMs) {
    d3.select(this).call(brush.move, x.domain().map(i => xBrush(i)))
  } else {
    x.domain(s.map(xBrush.invert, xBrush))
    y()
    // xBrush.domain([
    //   d3.timeMillisecond.offset(dmn[0], -(x.invert(indent) - x.invert(0))),
    //   x.invert(d3.max(rows) + gapY)
    // ])
    // svgBottom.select('.axisBottomDate').call(axisBottomDate)
    svgTop.select('.axisTopDay').call(axisTopDay)
    svgTop.select('.axisTopDate').call(axisTopDate)
    svgTop.select('.axisTopTime').call(axisTopTime)
    chart.selectAll('g')
      .attr('transform', d => `translate(${x(d.serviceStartTime)}, ${d.y})`)
    g.selectAll('.cellBack')
      .attr('width', d => cellWidth(d))
    g.selectAll('.cell')
      .attr('width', d => cellWidthFront(d))
      .attr('x', d => x(d.startTime) - x(d.serviceStartTime))
    g.selectAll('foreignObject')
      .attr('x', d => x(d.startTime) - x(d.serviceStartTime))
      .attr('width', d => cellWidthFront(d))
    todayLine.attr('x1', x(new Date())).attr('x2', x(new Date()))
    todayCircle.attr('cx', x(new Date()))
    evenDaysWidth = x(dayInMs) - x(0)
    svgBack.selectAll('rect').attr('x', d => x(d)).attr('width', evenDaysWidth)
    svg.call(
      zoom.transform,
      d3.zoomIdentity.scale(width / (s[1] - s[0])).translate(-s[0], 0)
    )
  }
  zoombrush = 0
}

function zoomed(e) {
  if (zoombrush) return
  zoombrush = 1
  const t = e.transform
  x.domain(t.rescaleX(xBrush).domain())
  y()
  svgTop.select('.axisTopDay').call(axisTopDay)
  svgTop.select('.axisTopDate').call(axisTopDate)
  svgTop.select('.axisTopTime').call(axisTopTime)
  chart.selectAll('g')
    .attr('transform', d => `translate(${x(d.serviceStartTime)}, ${d.y})`)
  g.selectAll('.cellBack')
    .attr('width', d => cellWidth(d))
  g.selectAll('.cell')
    .attr('width', d => cellWidthFront(d))
    .attr('x', d => x(d.startTime) - x(d.serviceStartTime))
  g.selectAll('foreignObject')
    .attr('x', d => x(d.startTime) - x(d.serviceStartTime))
    .attr('width', d => cellWidthFront(d))
  todayLine.attr('x1', x(new Date())).attr('x2', x(new Date()))
  todayCircle.attr('cx', x(new Date()))
  evenDaysWidth = x(dayInMs) - x(0)
  svgBack.selectAll('rect').attr('x', d => x(d)).attr('width', evenDaysWidth)
  gb.call(brush.move, xBrush.range().map(t.invertX, t))
  zoombrush = 0
}

window.onresize = () => {
  width = document.documentElement.clientWidth
  height = document.documentElement.clientHeight
  x.range([0, width])
  xBrush.range([0, width])
  svgTop.select('.axisTopDay').call(axisTopDay)
  svgTop.select('.axisTopDate').call(axisTopDate)
  svgTop.select('.axisTopTime').call(axisTopTime)
  svgBottom.select('.axisBottomDate').call(axisBottomDate)
  gGooey.select('rect').attr('width', width)
  gGooey.selectAll('circle').attr('cx', d => xBrush(d.startTime))
  gb.call(brush.extent([[0, 1], [width, brushHeight]]))
    .call(brush.move, x.domain().map(i => xBrush(i)))
}