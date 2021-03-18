let cities = JSON.parse(localStorage.getItem('CITIES_LIST') || '[]')

const API_KEY = "436d1a96e5cb42e294ec78b059ab8e71"
const API_URL = "https://api.weatherbit.io/v2.0/current?lang=ru&"

const DEFAULT_COORDS = {lat: 55.752, lon: 37.615}

const veretifyCity = (name) => {
    if (name == '') return false
    return /^[a-zA-Zа-яА-я \-]+$/.test(name)
}

const createMiniLoader = (id) => {
    let loader = createElement('li', {class: 'col-item mini-loader', id: id}, 
        createElement('span', null, 'Загрузка'),
        createElement('img', {src: '/static/images/loader.svg'})
    )
    return loader
} 

const createLoader = (id = 'cur-weather-loader') => {
    let loader = createElement('li', {class: 'loader', id: id}, 
        createElement('span', null, 'Загрузка'),
        createElement('img', {src: '/static/images/loader.svg'})
    )
    return loader
}

function loadData(data) {
    return new Promise((resolve, reject) => {
        if (data.name) {
            fetch(`${API_URL}city=${data.name}&key=${API_KEY}`)
                .then(res => res.json())
                .then(data => {
                    if(data.error || data.count !== 1) {
                        reject(data.error)
                    } else {
                        return resolve(parseApiRequest(data.data[0]))
                    }
                })
                .catch(err => reject(err))
        }
        else {
            if(data.coord) {
                fetch(`${API_URL}lat=${data.coord.lat}&lon=${data.coord.lon}&key=${API_KEY}`)
                    .then(res => res.json())
                    .then(data => {
                        if(data.error || data.count !== 1) {
                            reject(data.error)
                        } else {
                            return resolve(parseApiRequest(data.data[0]))
                        }
                    })
                    .catch(err => reject(err))
            }
            else {
                reject('Invalid data')
            }
        }
    })
}

const parseApiRequest = (data) => {
    let result = {
        city: data.city_name,
        img: `https://www.weatherbit.io/static/img/icons/${data.weather.icon}.png`,
        params: [
            {name: 'Ветер', value: `${data.wind_spd}, ${data.wind_cdir_full}`},
            {name: 'Облачность', value: `${data.clouds} %`},
            {name: 'Давление', value: `${data.pres} мм.рт.ст`},
            {name: 'Влажность', value: `${data.rh} %`},
            {name: 'Координаты', value: `[${data.lat}, ${data.lon}]`},
        ],
        temp: data.temp,
    }
    return result
}

cities.add = (function() {
    return function() {
        // console.log(arguments)
        arguments[0] = arguments[0].toString().toLowerCase()
        let name = arguments[0] 
        let args = arguments

        if(!veretifyCity(name)) {
            alert('Неправильное имя городв')
            return
        }

        addCity(name, (name) => this.indexOf(name) !== -1, (name) => {
            args[0] = name
            Array.prototype.push.apply(this, args)
            localStorage.setItem('CITIES_LIST', JSON.stringify(this))
        })
    }
})()

cities.remove = (function() {
    return function() {
        let name = arguments[0].toString()
        name = name.toLowerCase()

        // alert(name)

        let index = this.indexOf(name)

        // console.log(index)

        if(index !== -1) {
            this.splice(index, 1)
            localStorage.setItem('CITIES_LIST', JSON.stringify(this))
        }
    }
})()

const createCity = (data) => {
    let params = data.params.map(el => createElement(
        'li',
        null,
        createElement('span', {class: 'name'}, el.name),
        createElement('span', {class: 'value'}, el.value)
    ))

    let city = createElement(
        'li',
        {class: 'col-item city-card'},
        createElement(
            'div',
            {class: 'header-weather'},
            createElement('h3', null, `${data.city}`),
            createElement('span', null, `${data.temp}`),
            createElement('img', {src: data.img}),
            createElement('button', {class: 'circle-button', onclick: `deleteCity(this, "${data.city.toLowerCase()}")`}, 'X')
        ),
        createElement(
            'ul',
            {class: 'weather'},
            ...params
        )
    )

    return city
}

const deleteCity = (element, name) => {
    element.parentElement.parentElement.remove()
    cities.remove(name)
}

const addCity = (name, checkRepeats, callback) => {
    document.getElementById('city-favs').append(createMiniLoader(`load-city-${name}`))
    let loader = document.getElementById(`load-city-${name}`)

    loadData({name: name, coord: null})
        .then(data => {
            // console.log(data)
            if(checkRepeats && checkRepeats(data.city.toLowerCase())) {
                alert('Город уже есть в списке избранных')
                document.getElementById(`load-city-${name}`).remove()
                return
            }
            let city = createCity(data)
            
            document.getElementById('city-favs').replaceChild(city, loader)
            if(callback) callback(data.city.toLowerCase())
        })
        .catch(err => {
            alert('Произошла ошибка при взаимодейтвии с API')
        })
}

function createElement() {
    // console.log(arguments)
    let element = document.createElement(arguments[0])
    if(arguments[1]) {
        Object.keys(arguments[1]).forEach(attr => {
            element.setAttribute(attr, arguments[1][attr])
        })       
    }

    for(let i = 2; i < arguments.length; i++) {
        if(typeof arguments[i] === 'function') {
            element.append(arguments[i]())
        } else {
            element.append(arguments[i])
        }
    }

    return element
}

const renderCurrentWeather = (coords) => {
    let section = document.getElementById('cur-weather')
    section.innerHTML = ''
    section.append(createLoader())

    loadData({name: null, coord: coords})
        .then(data => {
            document.title = data.city
            let params = data.params.map(el => createElement(
                'li',
                null,
                createElement('span', {class: 'name'}, el.name),
                createElement('span', {class: 'value'}, el.value)
            ))

            let curWeather = createElement(
                'div',
                {class: 'flex-cols'},
                createElement(
                    'div',
                    {class: 'col-item'},
                    createElement('h2', null, data.city),
                    createElement(
                        'div',
                        {class: 'flex-row'},
                        createElement('img', {src: data.img}),
                        createElement('span', null, data.temp)
                    )
                ),
                createElement(
                    'div',
                    {class: 'col-item cur-weather-metrics'},
                    createElement(
                        'ul',
                        {class: 'weather'},
                        ...params
                    )
                )
            )

            section.replaceChild(curWeather, document.getElementById('cur-weather-loader'))
        })
        .catch(err => {
            alert('Произошла ошибка взаимодействия с API')
        })
}

const loadCurrentWeather = () => {
    if(!navigator.geolocation) {
        alert('Геолокация отключена')
        renderCurrentWeather(DEFAULT_COORDS)
    } else {
        navigator.geolocation.getCurrentPosition(
            (location) => {
                renderCurrentWeather({lat: location.coords.latitude, lon: location.coords.longitude})
            },
            () => {
                alert('Нет доступа к вашей геопозиции. Использую позицию по умолчанию')
                renderCurrentWeather(DEFAULT_COORDS)
            }
        )
    }
}

loadCurrentWeather()

document.getElementById('new-city').onsubmit = function(e) {
    e.preventDefault()

    let name = document.getElementById('city-name').value 

    cities.add(name)

    document.getElementById('city-name').value = ''

    return false
}

document.getElementById('reload-button').onclick = loadCurrentWeather

cities.forEach(city => {
    addCity(city)
})
