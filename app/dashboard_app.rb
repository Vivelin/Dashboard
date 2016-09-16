require 'sinatra/base'
require 'better_errors'
require 'tilt/haml'
require 'tilt/sass'
require 'yaml'

class DashboardApp < Sinatra::Base
    configure :development do
      use BetterErrors::Middleware
      BetterErrors.application_root = __dir__
    end

    configure do
      set :root, File.expand_path(File.dirname(File.dirname(__FILE__)))
      set :haml, escape_html: true
      set :sass, views: 'styles'

      config = YAML.load_file('config/application.yml')
      set :channels, config['channels'] || []
      set :clientID, config['clientID'] || ''
    end

    get '/styles/:style.css' do
      begin
        sass params[:style].to_sym
      rescue Errno::ENOENT
        pass
      end
    end

    get '/' do
      haml :index
    end
end