FROM jekyll/jekyll

WORKDIR /srv/jekyll

# Copy only dependency manifests first (layer caching)
COPY Gemfile Gemfile.lock ./

RUN bundle install

# Then copy the rest of the site
COPY . .

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--watch", "--force_polling", "--host", "0.0.0.0", "--destination", "/tmp/_site"]
