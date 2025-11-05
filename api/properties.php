<?php
// Файл api/properties.php
// Прокси для интеграции с Realt.by API, преобразование XML в JSON для JS

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// URL внешнего API
$apiUrl = 'https://realt.by/bff/proxy/export/api/export/token/e68b296c864d8a9';

// Функция для получения данных с внешнего API
function fetchData($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Увеличено для большого ответа
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'); // Мимик браузера
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        if ($response === false || $httpCode !== 200) {
            error_log('Ошибка получения данных с API: ' . $curlError . ' (HTTP ' . $httpCode . ')');
            return false;
        }
        return $response;
    } else {
        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        ]);
        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            error_log('Ошибка file_get_contents с API');
            return false;
        }
        return $response;
    }
}

$response = fetchData($apiUrl);

if ($response === false) {
    error_log('Не удалось получить данные с Realt.by API');
    // Возвращаем мок-данные
    $mockData = [
        [
            "title" => "Квартира в центре Минска",
            "location" => "Минск, Центр",
            "price" => 120000,
            "type" => "Квартира",
            "description" => "Уютная квартира с современным ремонтом.",
            "features" => ["3 комнаты", "Балкон", "Ремонт"],
            "photos" => ["https://via.placeholder.com/400x300?text=Property+1"]
        ],
        [
            "title" => "Дом в пригороде",
            "location" => "Минский район",
            "price" => 250000,
            "type" => "Дом",
            "description" => "Просторный дом с большим участком.",
            "features" => ["5 комнат", "Гараж", "Сад"],
            "photos" => ["https://via.placeholder.com/400x300?text=Property+2"]
        ]
    ];
    echo json_encode($mockData);
    exit;
}

// Парсим XML
libxml_use_internal_errors(true);
$xml = simplexml_load_string($response, "SimpleXMLElement", LIBXML_NOCDATA);
if ($xml === false) {
    $errors = libxml_get_errors();
    $errorMessages = array_map(function($e) { return $e->message; }, $errors);
    error_log('Ошибка парсинга XML: ' . implode("; ", $errorMessages));
    // Возвращаем мок-данные
    $mockData = [
        [
            "title" => "Квартира в центре Минска",
            "location" => "Минск, Центр",
            "price" => 120000,
            "type" => "Квартира",
            "description" => "Уютная квартира с современным ремонтом.",
            "features" => ["3 комнаты", "Балкон", "Ремонт"],
            "photos" => ["https://via.placeholder.com/400x300?text=Property+1"]
        ],
        [
            "title" => "Дом в пригороде",
            "location" => "Минский район",
            "price" => 250000,
            "type" => "Дом",
            "description" => "Просторный дом с большим участком.",
            "features" => ["5 комнат", "Гараж", "Сад"],
            "photos" => ["https://via.placeholder.com/400x300?text=Property+2"]
        ]
    ];
    echo json_encode($mockData);
    exit;
}

// Преобразуем в массив объектов
$properties = [];
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20; // Ограничение для производительности
$count = 0;

foreach ($xml->records->record as $record) {
    if ($count >= $limit) break;

    // Фильтры: активные, на продажу, с ценой
    $archive = (int)$record->archive;
    $terms = (string)$record->terms;
    $price = (int)$record->price;

    if ($archive !== 0 || !in_array($terms, ['ч', 'пр']) || $price <= 0) {
        continue;
    }

    // Сбор фото
    $photos = [];
    if (isset($record->photos->photo)) {
        foreach ($record->photos->photo as $photo) {
            $photos[] = (string)$photo['picture'];
            if (count($photos) >= 10) break; // Ограничение фото
        }
    }

    // Сбор характеристик
    $features = [];
    if (!empty($record->rooms)) $features[] = "Комнаты: " . (string)$record->rooms;
    if (!empty($record->area_total)) $features[] = "Площадь: " . (string)$record->area_total . " м²";
    if (!empty($record->area_living)) $features[] = "Жилая: " . (string)$record->area_living . " м²";
    if (!empty($record->area_kitchen)) $features[] = "Кухня: " . (string)$record->area_kitchen . " м²";
    if (!empty($record->building_year)) $features[] = "Год: " . (string)$record->building_year;
    if (!empty($record->heating_expanded)) $features[] = "Отопление: " . (string)$record->heating_expanded;
    if (!empty($record->storey) && !empty($record->storeys)) $features[] = "Этаж: " . (string)$record->storey . "/" . (string)$record->storeys;
    if (!empty($record->house_type_expanded)) $features[] = "Тип дома: " . (string)$record->house_type_expanded;
    if (!empty($record->repair_state_expanded)) $features[] = "Ремонт: " . (string)$record->repair_state_expanded;

    // Дополнительные параметры
    $additional_params = [];
    if (!empty($record->balcony)) $additional_params[] = "Балкон";
    if (!empty($record->parking)) $additional_params[] = "Парковка";
    if (!empty($record->lift)) $additional_params[] = "Лифт";
    if (!empty($record->concierge)) $additional_params[] = "Консьерж";
    if (!empty($record->internet)) $additional_params[] = "Интернет";
    if (!empty($record->furniture)) $additional_params[] = "Мебель";
    if (!empty($record->appliances)) $additional_params[] = "Бытовая техника";

    // Локация
    $location = '';
    if (!empty($record->town_name)) {
        $location = (string)$record->town_name;
        if (!empty($record->street_name)) $location .= ', ' . (string)$record->street_name;
        if (!empty($record->house_number)) $location .= ' ' . (string)$record->house_number;
    } elseif (!empty($record->state_district_name)) {
        $location = (string)$record->state_district_name;
    } else {
        $location = (string)$record->state_region_name;
    }

    // Описание (убираем HTML-теги)
    $description = html_entity_decode(strip_tags((string)$record->description));

    // Заголовок
    $title = (string)$record->object_type_expanded . ' #' . (string)$record->code;

    $properties[] = [
        "title" => $title,
        "location" => $location,
        "price" => $price,
        "type" => (string)$record->object_type_expanded,
        "description" => $description,
        "features" => $features,
        "additional_params" => $additional_params,
        "photos" => $photos,
        "area_total" => (string)$record->area_total,
        "rooms" => (string)$record->rooms,
        "storey" => (string)$record->storey,
        "storeys" => (string)$record->storeys,
        "repair_state" => (string)$record->repair_state_expanded,
        "heating" => (string)$record->heating_expanded,
        "building_year" => (string)$record->building_year,
        "house_type" => (string)$record->house_type_expanded
    ];

    $count++;
}

// Возвращаем данные
if (empty($properties)) {
    // Мок-данные если ничего не подошло
    $properties = [
        [
            "title" => "Квартира в центре Минска",
            "location" => "Минск, Центр",
            "price" => 120000,
            "type" => "Квартира",
            "description" => "Уютная квартира с современным ремонтом.",
            "features" => ["3 комнаты", "Балкон", "Ремонт"],
            "photos" => ["https://via.placeholder.com/400x300?text=Property+1"]
        ],
        [
            "title" => "Дом в пригороде",
            "location" => "Минский район",
            "price" => 250000,
            "type" => "Дом",
            "description" => "Просторный дом с большим участком.",
            "features" => ["5 комнат", "Гараж", "Сад"],
            "photos" => ["https://via.placeholder.com/400x300?text=Property+2"]
        ]
    ];
}

echo json_encode($properties);
?>
