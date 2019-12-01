<?php

    /**
     * Expose the user email info to the users RESTful API
     */
    function email_add_user_data() {
        register_rest_field('user',
            'user_email',
            array(
                'get_callback'    => function ( $user ) {
                    $meta = get_usermeta($user['id'], 'user_email');
                    return $meta;
                },
                'update_callback' => null,
                'schema'          => null,
            )
        );
    }

    add_action( 'rest_api_init', 'email_add_user_data' );
