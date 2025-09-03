# VeiNovel

A modern web novel reading platform built with Laravel and React.

## Features

- **Multi-theme Support**: Dark, Light, Sepia, Cool Dark, Frost, and Solarized themes
- **Series Management**: Browse and read web novels with chapter organization
- **Premium Content**: Coin-based premium chapter system
- **User Authentication**: Secure user registration and login
- **Responsive Design**: Mobile-friendly interface
- **Chapter Tracking**: Track reading progress and owned chapters
- **Advanced Search**: Filter and explore series by genre, language, and status

## Tech Stack

- **Backend**: Laravel 11.x
- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: SQLite (development)
- **Authentication**: Laravel Sanctum

## Installation

1. Clone the repository
```bash
git clone https://github.com/Rann27/Veino.git
cd Veino
```

2. Install dependencies
```bash
composer install
npm install
```

3. Environment setup
```bash
cp .env.example .env
php artisan key:generate
```

4. Database setup
```bash
php artisan migrate
php artisan db:seed
```

5. Build assets
```bash
npm run build
```

6. Start the development server
```bash
php artisan serve
npm run dev
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
